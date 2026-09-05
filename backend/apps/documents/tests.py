from django.contrib.auth import get_user_model
from django.test import TestCase

from .encryption import decrypt_bytes, encrypt_bytes
from .models import Document

User = get_user_model()


class EncryptionTests(TestCase):
    def test_roundtrip(self):
        plaintext = b'Super secret document content 12345'
        key = b'0' * 32
        nonce, ciphertext, checksum = encrypt_bytes(plaintext, key)
        self.assertNotEqual(plaintext, ciphertext)
        decrypted = decrypt_bytes(ciphertext, key, nonce)
        self.assertEqual(plaintext, decrypted)

    def test_tamper_detected(self):
        plaintext = b'tamper test content'
        key = b'0' * 32
        nonce, ciphertext, _ = encrypt_bytes(plaintext, key)
        corrupted = bytes([ciphertext[0] ^ 0xFF]) + ciphertext[1:]
        with self.assertRaises(Exception):
            decrypt_bytes(corrupted, key, nonce)


class DocumentModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='docuser', email='doc@example.com', password='StrongPass1!'
        )

    def test_set_and_decrypt_content(self):
        doc = Document(user=self.user, title='Test')
        doc.set_content(b'hello encrypted world')
        doc.save()
        self.assertEqual(doc.decrypt_content(), b'hello encrypted world')
        self.assertGreater(doc.file_size, 0)
        self.assertTrue(doc.checksum)

    def test_soft_delete_and_restore(self):
        doc = Document.objects.create(user=self.user, title='Temp')
        doc.soft_delete()
        self.assertTrue(doc.is_deleted)
        doc.restore()
        self.assertFalse(doc.is_deleted)
