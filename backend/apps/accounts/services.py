import secrets

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from .models import ActiveSession


def _generate_token(length=64):
    return secrets.token_urlsafe(length)


def create_active_session(user, request):
    """Record a new active session from the current request."""
    from user_agents import parse

    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
    if ip and ',' in ip:
        ip = ip.split(',')[0].strip()
    ua_string = request.META.get('HTTP_USER_AGENT', '')
    ua = parse(ua_string)

    session_key = request.session.session_key or secrets.token_hex(16)
    ActiveSession.objects.filter(user=user, is_active=True, session_key=session_key)\
        .update(is_active=False)
    ActiveSession.objects.create(
        user=user,
        session_key=session_key,
        ip_address=ip,
        user_agent=ua_string,
        device_type='mobile' if ua.is_mobile else ('tablet' if ua.is_tablet else 'desktop'),
        browser=ua.browser.family,
        os=ua.os.family,
        expires_at=timezone.now() + timezone.timedelta(days=int(
            settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME').days)),
    )


def is_account_locked(user):
    return user.is_locked


def lock_account_after_failures(user):
    user.increment_failed_login()


def reset_failed_login(user):
    user.reset_failed_login()


def send_verification_email(user, request):
    token = _generate_token()
    user.email_verification_token = token
    user.save(update_fields=['email_verification_token'])
    base = f"{request.scheme}://{request.get_host()}"
    link = f"{base}/verify-email/{token}"
    html = render_to_string('emails/verify_email.html', {'user': user, 'link': link})
    send_mail(
        subject='Verify your email',
        message=f'Verify your email: {link}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html,
    )


def send_password_reset_email(user, request):
    token = _generate_token()
    user.password_reset_token = token
    user.password_reset_expires = timezone.now() + timezone.timedelta(hours=1)
    user.save(update_fields=['password_reset_token', 'password_reset_expires'])
    base = f"{request.scheme}://{request.get_host()}"
    link = f"{base}/reset-password/{token}"
    html = render_to_string('emails/password_reset.html', {'user': user, 'link': link})
    send_mail(
        subject='Reset your password',
        message=f'Reset your password: {link}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html,
    )


def verify_account(token):
    from .models import User
    try:
        user = User.objects.get(email_verification_token=token)
    except User.DoesNotExist:
        return False
    user.email_verified = True
    user.email_verification_token = ''
    user.save(update_fields=['email_verified', 'email_verification_token'])
    return True


def verify_reset_token(token):
    from .models import User
    try:
        user = User.objects.get(password_reset_token=token)
    except User.DoesNotExist:
        return None
    if user.password_reset_expires and user.password_reset_expires < timezone.now():
        return None
    return user
