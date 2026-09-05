#!/usr/bin/env python
"""Rotate the per-document encryption keys for Secure Document Vault.

WARNING: This is a destructive operation that re-encrypts all documents.
Run this during a maintenance window.

Usage:
    python scripts/rotate_keys.py [--dry-run]
"""
import argparse
import os
import sys
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description='Rotate per-document encryption keys')
    parser.add_argument('--dry-run', action='store_true',
                        help='Only report what would happen without re-encrypting')
    return parser.parse_args()


def main():
    args = parse_args()

    project_root = Path(__file__).resolve().parent.parent
    sys.path.insert(0, str(project_root / 'backend'))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    try:
        import django
        django.setup()
    except Exception as e:
        print(f'ERROR: Could not set up Django: {e}')
        sys.exit(1)

    from apps.documents.models import Document, DocumentVersion

    documents = Document.objects.filter(is_deleted=False)
    total = documents.count()
    print(f'Found {total} documents to re-encrypt.')

    if args.dry_run:
        print('DRY RUN - no changes will be written.')
        print(f'Would re-encrypt {total} documents and all their versions.')
        return

    encrypted_count = 0
    failed_count = 0

    for doc in documents:
        try:
            plaintext = doc.decrypt_content()
            doc.set_content(plaintext)
            doc.save()
            encrypted_count += 1
        except Exception as e:
            failed_count += 1
            print(f'  SKIPPED document {doc.id}: {e}')
            continue

    print(f'\nRotation complete:')
    print(f'  Successfully re-encrypted: {encrypted_count}')
    print(f'  Failed: {failed_count}')

    if failed_count > 0:
        print('\nWARNING: Some documents could not be re-encrypted.')
        print('Check the errors above and investigate before continuing.')

    print('\nAfter confirming everything works, delete the old encryption key backups.')


if __name__ == '__main__':
    main()
