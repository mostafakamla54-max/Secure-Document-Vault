from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from .models import ActiveSession
from .validators import validate_password_strength

User = get_user_model()


class UserModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='StrongPass1!',
        )

    def test_create_user(self):
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.email_verified)

    def test_lock_and_unlock(self):
        self.assertFalse(self.user.is_locked)
        self.user.lock_account()
        self.assertTrue(self.user.is_locked)
        self.user.unlock_account()
        self.assertFalse(self.user.is_locked)

    def test_failed_login_locks_after_ten(self):
        for _ in range(10):
            self.user.increment_failed_login()
        self.assertTrue(self.user.is_locked)
        self.assertEqual(self.user.failed_login_attempts, 10)

    def test_failed_login_not_locked_before_ten(self):
        for _ in range(9):
            self.user.increment_failed_login()
        self.assertFalse(self.user.is_locked)
        self.assertEqual(self.user.failed_login_attempts, 9)


class PasswordValidatorTests(TestCase):
    def test_weak_passwords_rejected(self):
        for pw in ['short', 'lowercaseonly1!', 'NOLOWERCASE1!', 'NoSpecial1', 'onlyupper!']:
            with self.assertRaises(Exception):
                validate_password_strength(pw)

    def test_strong_password_accepted(self):
        validate_password_strength('StrongPass1!')


class ActiveSessionTests(TestCase):
    def test_session_expiry_property(self):
        session = ActiveSession(
            user=None,
            session_key='abc',
            ip_address='127.0.0.1',
            expires_at=timezone.now() - timezone.timedelta(minutes=1),
        )
        self.assertTrue(session.is_expired)
