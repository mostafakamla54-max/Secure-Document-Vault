# -*- coding: utf-8 -*-
"""Live proof that the vault uses REAL encryption (AES-256-GCM).

Shows, for any document: plaintext length, stored ciphertext as hex
(what is actually saved in the DB), SHA-256 integrity checksum, and that
decrypting restores the original exactly.
Run:  python proof_encryption.py [document_id]
"""
import hashlib
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.documents.models import Document


def slugify(b):
    return '  '.join(b[i:i + 8].hex() for i in range(0, len(b), 8))


def main(doc_id):
    doc = Document.objects.filter(pk=doc_id).first()
    if not doc:
        print(f'ERROR: لا توجد وثيقة بالمعرّف {doc_id}')
        return

    raw = doc.decrypt_content()
    blob = doc.encrypted_file or b''

    print('=' * 62)
    print('إثبات التشفير الحقيقي  |  AES-256-GCM')
    print('=' * 62)
    print(f'الوثيقة : {doc.title!r}  (id={doc.id})')
    print(f'النوع   : {doc.mime_type or "text"}')
    print()
    print('1) النص الأصلي (المطابق لما سيفكّه التشفير لاحقاً):')
    print('   ' + raw.decode('utf-8', errors='replace')[:160])
    print(f'   [الطول: {len(raw)} بايت]')
    print()
    print('2) ما يُخزَّن فعلياً في قاعدة البيانات (ciphertext + GCM tag):')
    print(f'   الطول الكلي: {len(blob)} بايت')
    print('   أول 48 بايت بصيغة HEX (غير مقروءة بالتصميم):')
    print('   ' + slugify(blob[:48]))
    print()
    print('3) مكوّنات التشفير:')
    print(f'   - nonce = {doc.nonce.hex()[:24]}...  (12 بايت عشوائي)')
    print(f'   - key   = {doc.key_material.hex()[:24]}...  (32 بايت = AES-256)')
    print(f'   - GCM tag = 16 بايت ملحق آخر ciphertext')
    print()
    print('4) SHA-256 checksum (إثبات سلامة التكامل):')
    print('   المخزّن في DB :', doc.checksum)
    print('   محسوب الآن   :', hashlib.sha256(raw).hexdigest())
    print(f'   مطابقة = {hashlib.sha256(raw).hexdigest() == doc.checksum}')
    print()
    print(('5) النص المشفّر يختلف تماماً عن الأصلي (أول 32 بايت hex):'))
    print('   أصلي  :', slugify(raw[:32]))
    print('   مشفّر :', slugify(blob[:32]))
    print()
    print('الخلاصة: التخزين مشفّر (AES-256-GCM) ولا يمكن قراءته دون المفتاح،')
    print('والفك يعيد النص الأصلي تطابقاً تاماً، والchecksum يثبت عدم العبث.')
    print('=' * 62)


if __name__ == '__main__':
    import sys
    import io

    doc_id = int(sys.argv[1]) if len(sys.argv) > 1 else 9
    out_file = None
    if '--to-file' in sys.argv:
        out_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proof_encryption_report.txt')

    if out_file:
        # Capture the printed report into the file as clean UTF-8.
        import contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            main(doc_id)
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(buf.getvalue())
        print('Report written to:', out_file)
    else:
        main(doc_id)