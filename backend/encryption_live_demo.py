#!/usr/bin/env python
"""Live proof-of-encryption demo to show a professor.

Runs entirely with Django's real encryption path (set_content / decrypt_content).
No external files are created except in the DB, and the test doc is removed at the end.
"""
import hashlib
import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.documents.models import Document  # noqa: E402


def main():
    SECRET = b'THIS IS THE PLAIN FILE THE USER UPLOADED: budget 50000, contact john@example.com'

    user = User.objects.filter(is_superuser=True).first() or User.objects.first()
    doc = Document.objects.create(
        user=user, title='Live Demo Proof', description='encryption demo',
        category='work', importance='high',
    )
    try:
        doc.set_content(SECRET)
        doc.save()

        stored = doc.encrypted_file
        checksum = hashlib.sha256(SECRET).hexdigest()

        width = 62
        print('=' * width)
        print('  REAL ENCRYPTION DEMO  (AES-256-GCM)')
        print('=' * width)

        print('\n[1] Plain file uploaded (raw bytes):')
        print('    %s' % (SECRET.decode('utf-8', 'replace')[:64] + '...'))
        print('    length = %d bytes' % len(SECRET))

        print('\n[2] What is stored in the database (encrypted):')
        print('    stored length = %d bytes' % len(stored))
        print('    first 48 bytes as HEX:')
        for i in range(0, min(len(stored), 48), 16):
            chunk = stored[i:i + 16]
            print('      %s' % ' '.join('%02x' % b for b in chunk))

        print('\n[3] Is the plaintext visible in the DB?  -> %s' %
              ('NO (not present anywhere)' if SECRET not in stored else 'YES - LEAKED'))

        print('\n[4] SHA-256 checksum of original file:  %s...' % checksum[:16])

        decrypted = doc.decrypt_content()
        print('\n[5] Decrypt on access using the real model method:')
        print('    matches original exactly?  -> %s' % (decrypted == SECRET))
        print('\nConclusion: the file is stored encrypted and is decrypted only on access.')
        print('=' * width)
    finally:
        doc.delete()
        print('\n(Test document cleaned up.)')


if __name__ == '__main__':
    main()