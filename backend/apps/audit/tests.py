from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import AuditLog

User = get_user_model()


class AuditLogTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='auditor', email='audit@example.com', password='StrongPass1!'
        )

    def test_log_manager_creates_record(self):
        log = AuditLog.objects.log(
            actor=self.user,
            action='DOCUMENT_CREATE',
            object_type='document',
            object_id='42',
            detail='Created "test"',
            ip_address='127.0.0.1',
            severity='info',
        )
        self.assertEqual(AuditLog.objects.count(), 1)
        self.assertEqual(log.action, 'DOCUMENT_CREATE')
        self.assertEqual(log.object_id, '42')

    def test_type_inference(self):
        log = AuditLog.objects.log(actor=self.user, action='DOCUMENT_VIEW')
        self.assertEqual(log.type(), 'document')

    def test_ordering_descending(self):
        AuditLog.objects.log(actor=self.user, action='FIRST')
        AuditLog.objects.log(actor=self.user, action='SECOND')
        qs = AuditLog.objects.all()
        self.assertEqual(qs[0].action, 'SECOND')
