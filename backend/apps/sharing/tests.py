from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.documents.models import Document

from .models import DocumentShare

User = get_user_model()


class ShareModelTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner', email='owner@example.com', password='StrongPass1!'
        )
        self.recipient = User.objects.create_user(
            username='recipient', email='recipient@example.com', password='StrongPass1!'
        )
        self.doc = Document.objects.create(user=self.owner, title='Secret')

    def test_can_access_active(self):
        share = DocumentShare.objects.create(
            document=self.doc,
            shared_by=self.owner,
            shared_with=self.recipient,
            email=self.recipient.email,
            permission='view',
            access_token='abc123token',
        )
        self.assertTrue(share.can_access())

    def test_expired_share_blocked(self):
        share = DocumentShare.objects.create(
            document=self.doc,
            shared_by=self.owner,
            email='x@example.com',
            access_token='token2',
            expires_at=timezone.now() - timezone.timedelta(hours=1),
        )
        self.assertTrue(share.is_expired)
        self.assertFalse(share.can_access())

    def test_record_access(self):
        share = DocumentShare.objects.create(
            document=self.doc,
            shared_by=self.owner,
            email='x@example.com',
            access_token='token3',
        )
        share.record_access()
        share.refresh_from_db()
        self.assertEqual(share.view_count, 1)
        self.assertTrue(share.is_viewed)
