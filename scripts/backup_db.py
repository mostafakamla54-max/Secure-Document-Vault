#!/usr/bin/env python
"""Backup the Secure Document Vault database and encryption keys.

Usage:
    python scripts/backup_db.py [--output-dir BACKUP_DIR]

Creates a timestamped backup of:
1. PostgreSQL database dump (only when USE_SQLITE=0)
2. .env file (contains the encryption key)
"""
import argparse
import datetime
import os
import shutil
import subprocess
import sys
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description='Backup Secure Document Vault data')
    parser.add_argument('--output-dir', default='backups',
                        help='Directory to store backups (default: backups)')
    parser.add_argument('--db-name', default=os.environ.get('POSTGRES_DB', 'secure_vault'),
                        help='Database name')
    parser.add_argument('--db-user', default=os.environ.get('POSTGRES_USER', 'vault_user'),
                        help='Database user')
    return parser.parse_args()


def main():
    args = parse_args()

    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    output_dir = Path(args.output_dir) / timestamp
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f'Backing up to: {output_dir}')

    env_path = Path(__file__).resolve().parent.parent / 'backend' / '.env'

    try:
        db_dump = output_dir / 'database.sql'
        cmd = ['pg_dump', '-U', args.db_user, '-d', args.db_name, '-f', str(db_dump)]
        print(f'Dumping database: {args.db_name}')
        subprocess.run(cmd, check=True,
                       env={**os.environ, 'PGPASSWORD': os.environ.get('POSTGRES_PASSWORD', '')})
        print(f'Database dump saved: {db_dump}')
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f'Database dump failed (is PostgreSQL running?): {e}')

    if env_path.exists():
        env_backup = output_dir / '.env.backup'
        shutil.copy(env_path, env_backup)
        print(f'Environment file backed up: {env_backup}')
    else:
        print('WARNING: .env file not found - make sure the encryption key is backed up separately!')

    # Back up the SQLite database when running in dev mode
    sqlite_db = Path(__file__).resolve().parent.parent / 'backend' / 'db.sqlite3'
    if sqlite_db.exists():
        shutil.copy(sqlite_db, output_dir / 'db.sqlite3')
        print('SQLite database backed up.')

    print(f'\nBackup complete: {output_dir}')
    print('Store this backup in a secure, offline location.')


if __name__ == '__main__':
    main()
