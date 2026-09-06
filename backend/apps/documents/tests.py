from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from .encryption import decrypt_bytes, encrypt_bytes
from .models import Document
from .serializers import MAX_UPLOAD_SIZE

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


class DocumentUploadTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='upluser', email='up@example.com', password='StrongPass1!'
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_upload_mobile_files_accepted(self):
        upload = SimpleUploadedFile('photo.jpg', b'fake-jpeg-bytes', content_type='image/jpeg')
        response = self.client.post('/api/v1/documents/', {
            'title': 'من الجوال',
            'category': 'personal',
            'importance': 'normal',
            'file': upload,
        }, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data['id'])
        doc = Document.objects.get(pk=response.data['id'])
        self.assertEqual(doc.original_filename, 'photo.jpg')
        self.assertEqual(doc.original_extension, 'jpg')
        self.assertEqual(doc.mime_type, 'image/jpeg')

    def test_upload_rejected_above_20mb(self):
        big = SimpleUploadedFile('big.mp4', b'x' * (MAX_UPLOAD_SIZE + 1), content_type='video/mp4')
        response = self.client.post('/api/v1/documents/', {
            'title': 'كبير',
            'category': 'general',
            'importance': 'normal',
            'file': big,
        }, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertIn('20MB', str(response.data['errors']['file']))
        self.assertEqual(Document.objects.count(), 0)
