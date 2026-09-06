from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

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


class TwoFactorLoginTests(TestCase):
    def setUp(self):
        import pyotp
        self.user = User.objects.create_user(
            username='twouser', email='two@example.com', password='StrongPass1!'
        )
        self.user.two_factor_secret = pyotp.random_base32()
        self.user.two_factor_enabled = True
        self.user.save()
        self.client = APIClient()

    def test_login_requires_2fa_challenge(self):
        response = self.client.post('/api/v1/accounts/login/', {
            'username': 'twouser', 'password': 'StrongPass1!'
        }, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data['requires_2fa'])
        self.assertTrue(response.data['twofa_token'])
        self.assertNotIn('access', response.data)

    def test_login_2fa_wrong_code_rejected(self):
        response = self.client.post('/api/v1/accounts/login/', {
            'username': 'twouser', 'password': 'StrongPass1!'
        }, format='json')
        bad = self.client.post('/api/v1/accounts/login/2fa/', {
            'twofa_token': response.data['twofa_token'], 'code': '000000'
        }, format='json')
        self.assertEqual(bad.status_code, 401)

    def test_login_2fa_correct_code_returns_tokens(self):
        import pyotp
        totp = pyotp.TOTP(self.user.two_factor_secret)
        challenge = self.client.post('/api/v1/accounts/login/', {
            'username': 'twouser', 'password': 'StrongPass1!'
        }, format='json').data
        okay = self.client.post('/api/v1/accounts/login/2fa/', {
            'twofa_token': challenge['twofa_token'], 'code': totp.now()
        }, format='json')
        self.assertEqual(okay.status_code, 200, okay.data)
        self.assertTrue(okay.data['access'])
        self.assertTrue(okay.data['refresh'])

    def test_login_without_2fa_returns_tokens_directly(self):
        self.user.two_factor_enabled = False
        self.user.save()
        response = self.client.post('/api/v1/accounts/login/', {
            'username': 'twouser', 'password': 'StrongPass1!'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['access'])
