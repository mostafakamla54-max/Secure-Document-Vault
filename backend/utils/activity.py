from django.utils import timezone


def mark_activity(user):
    """Update a user's last_activity timestamp without trusting client input."""
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])
