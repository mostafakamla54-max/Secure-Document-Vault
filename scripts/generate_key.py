#!/usr/bin/env python
"""Generate a new encryption master key for Secure Document Vault.

Usage:
    python scripts/generate_key.py

Outputs a Base64-encoded 256-bit key to stdout and prints instructions
for adding it to the .env file.
"""
import os
import base64
from pathlib import Path


def generate_key():
    key = os.urandom(32)
    return base64.b64encode(key).decode('utf-8')


def main():
    key_b64 = generate_key()

    print('\n' + '=' * 60)
    print(' GENERATED ENCRYPTION MASTER KEY ')
    print('=' * 60)
    print(f'\nKey (Base64, 32 bytes):\n{key_b64}')
    print('\nAdd this to your .env file:')
    print(f'DOCUMENT_ENCRYPTION_KEY={key_b64}')
    print('\nIMPORTANT:')
    print('1. Store this key securely - it CANNOT be recovered if lost.')
    print('2. Never commit it to version control.')
    print('3. Never send it to the frontend or log it.')
    print('4. Keep a secure backup of this key.')
    print('-' * 60)

    env_path = Path(__file__).resolve().parent.parent / 'backend' / '.env'
    print(f'\n.env file location: {env_path}')
    if env_path.exists():
        print('(.env already exists - update DOCUMENT_ENCRYPTION_KEY manually)')
    else:
        print('(Create backend/.env from backend/.env.example and set the key)')


if __name__ == '__main__':
    main()
