"""AES-256-GCM document encryption.

Per-document random keys are wrapped (encrypted) with a server-side master key
from ``DOCUMENT_ENCRYPTION_KEY`` in ``backend/.env``. A ``V2`` marker + nonce +
ciphertext + GCM tag is stored; if no master key is configured the raw key is
stored as before (legacy), so old deployments keep working untouched.
"""
import base64
import hashlib
import os
from pathlib import Path

from django.conf import settings

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

_WRAP_MARKER = b'V2'
_WRAP_LEN = 2 + 12 + 32 + 16  # marker + nonce + key + tag
_ENV_KEY = 'DOCUMENT_ENCRYPTION_KEY'

_master_cache = None


def _read_env_raw(key):
    """Read the last ``key=value`` line from backend/.env without printing it."""
    try:
        path = Path(settings.BASE_DIR) / '.env'
        if not path.exists():
            return ''
        for line in reversed(path.read_text(encoding='utf-8').splitlines()):
            if line.strip().startswith(key + '='):
                return line.split('=', 1)[1].strip()
    except OSError:
        pass
    return ''


def _master_key():
    """Return the 32-byte master key, or None when not configured."""
    global _master_cache
    if _master_cache is not None:
        return _master_cache or None
    raw = os.environ.get(_ENV_KEY, '').strip() or _read_env_raw(_ENV_KEY)
    key = None
    if raw:
        try:
            decoded = base64.b64decode(raw)
            if len(decoded) >= 32:
                key = decoded[:32]
        except Exception:
            key = None
    _master_cache = key
    return key


def wrap_key(key):
    """Wrap a per-document key with the master key (AES-256-GCM).

    Returns the raw key untouched when no master key is configured
    (legacy deployments keep working).
    """
    master = _master_key()
    if master is None:
        return key
    nonce = get_random_bytes(12)
    cipher = AES.new(master, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(key)
    return _WRAP_MARKER + nonce + ciphertext + tag


def unwrap_key(key_material):
    """Unwrap a ``V2``-wrapped key; pass plain keys through untouched."""
    key_material = bytes(key_material)
    if len(key_material) == _WRAP_LEN and key_material[:2] == _WRAP_MARKER:
        nonce = key_material[2:14]
        ciphertext, tag = key_material[14:-16], key_material[-16:]
        master = _master_key()
        if master is None:
            raise ValueError('Wrapped key found but no master key is configured')
        cipher = AES.new(master, AES.MODE_GCM, nonce=nonce)
        return cipher.decrypt_and_verify(ciphertext, tag)
    return key_material


def derive_key(key_material=None):
    """Return a 32-byte AES-256 key.

    With no argument, generate a fresh random key. With `key_material`
    (possibly master-wrapped), return the usable per-document key.
    """
    if key_material:
        return unwrap_key(key_material)
    return get_random_bytes(32)


def encrypt_bytes(raw_bytes, key):
    """Encrypt `raw_bytes` with AES-256-GCM.

    Returns (nonce, ciphertext_with_tag, checksum). The tag is appended to the
    ciphertext, matching how `decrypt_bytes` reads it.
    """
    nonce = get_random_bytes(12)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(raw_bytes)
    combined = ciphertext + tag
    checksum = hashlib.sha256(raw_bytes).hexdigest()
    return nonce, combined, checksum


def decrypt_bytes(encrypted_data, key, nonce):
    """Decrypt data produced by `encrypt_bytes` (ciphertext + 16-byte GCM tag)."""
    tag = encrypted_data[-16:]
    ciphertext = encrypted_data[:-16]
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    return cipher.decrypt_and_verify(ciphertext, tag)