from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.documents.models import Document

User = get_user_model()


class DocumentShare(models.Model):
    PERMISSION_CHOICES = [
        ('view', 'View'),
        ('edit', 'Edit'),
        ('comment', 'Comment'),
        ('full', 'Full Access'),
    ]

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='shares')
    shared_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='shares_created'
    )
    shared_with = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='shares_received', null=True, blank=True
    )
    email = models.EmailField(blank=True)
    permission = models.CharField(max_length=20, choices=PERMISSION_CHOICES, default='view')
    access_token = models.CharField(max_length=64, unique=True)
    message = models.TextField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_viewed = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    password_hash = models.CharField(max_length=128, blank=True)
    max_opens = models.PositiveIntegerField(null=True, blank=True, help_text='Maximum allowed views; null = unlimited')
    download_allowed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'document_shares'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shared_with', 'is_active']),
            models.Index(fields=['access_token']),
            models.Index(fields=['document', 'is_active']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f'{self.document.title} -> {self.shared_with or self.email}'

    @property
    def is_expired(self):
        return bool(self.expires_at and self.expires_at < timezone.now())

    def can_access(self):
        return self.is_active and not self.is_expired

    def accepts_password(self, password):
        if not self.password_hash:
            return True
        from django.contrib.auth.hashers import check_password
        return check_password(password or '', self.password_hash)

    def opens_remaining(self):
        if not self.max_opens:
            return None
        return max(0, self.max_opens - self.view_count)

    def record_access(self):
        self.view_count += 1
        self.is_viewed = True
        self.last_accessed_at = timezone.now()
        self.save(update_fields=['view_count', 'is_viewed', 'last_accessed_at'])


class ShareInvitation(models.Model):
    share = models.ForeignKey(DocumentShare, on_delete=models.CASCADE, related_name='invitations')
    token = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, default='pending')
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'share_invitations'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.email} -> {self.share.document.title} ({self.status})'


class SharedDocumentAccessLog(models.Model):
    share = models.ForeignKey(DocumentShare, on_delete=models.CASCADE, related_name='access_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    action = models.CharField(max_length=50)
    user_agent = models.CharField(max_length=500, blank=True)
    device = models.CharField(max_length=50, blank=True)
    browser = models.CharField(max_length=50, blank=True)
    os = models.CharField(max_length=50, blank=True)
    geo = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shared_document_access_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.share} {self.action} {self.created_at}'