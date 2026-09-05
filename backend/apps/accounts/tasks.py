from celery import shared_task

from django.utils import timezone

from .models import ActiveSession, User


@shared_task
def expire_inactive_sessions():
    """Deactivate sessions past their expiry."""
    expired = ActiveSession.objects.filter(
        is_active=True, expires_at__lte=timezone.now()
    )
    count = expired.count()
    expired.update(is_active=False)
    return f'Expired {count} inactive sessions'


@shared_task
def unlock_expired_locks():
    """Unlock accounts whose lock period has elapsed."""
    expired = User.objects.filter(locked_until__isnull=False, locked_until__lte=timezone.now())
    count = expired.count()
    for user in expired:
        user.reset_failed_login()
    return f'Unlocked {count} accounts'


@shared_task
def delete_expired_notifications(days=30):
    """Purge read notifications older than `days`."""
    from .models import Notification
    cutoff = timezone.now() - timezone.timedelta(days=days)
    deleted, _ = Notification.objects.filter(is_read=True, read_at__lte=cutoff).delete()
    return f'Deleted {deleted} notifications'
