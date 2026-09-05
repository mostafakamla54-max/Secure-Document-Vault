import hashlib
import os

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes


def derive_key(key_material=None):
    """Return a 32-byte AES-256 key.

    If `key_material` is provided it must already be a 32-byte key (returned
    from a previous call with no argument). Otherwise generate a fresh one and
    return it wrapped with a header so it can be identified later.
    """
    if key_material:
        return key_material
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
