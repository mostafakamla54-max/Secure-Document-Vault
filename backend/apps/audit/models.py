from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditLogManager(models.Manager):
    def log(self, actor=None, action='', object_type='', object_id=None,
            detail='', ip_address=None, severity='info'):
        # object_id is a non-null CharField; coerce None/blank to '' so the
        # NOT NULL constraint is never violated for system-level events.
        oid = str(object_id) if object_id is not None else ''
        return self.create(
            actor=actor,
            action=action,
            object_type=object_type,
            object_id=oid,
            detail=detail,
            ip_address=ip_address,
            severity=severity,
        )


class AuditLog(models.Model):
    SEVERITY_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    TYPES = [
        ('auth', 'Auth'),
        ('document', 'Document'),
        ('share', 'Share'),
        ('user', 'User'),
        ('system', 'System'),
        ('security', 'Security'),
    ]

    actor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=100)
    object_type = models.CharField(max_length=50, blank=True)
    object_id = models.CharField(max_length=50, blank=True)
    detail = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    created_at = models.DateTimeField(auto_now_add=True)

    objects = AuditLogManager()

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['actor']),
            models.Index(fields=['action']),
            models.Index(fields=['object_type', 'object_id']),
            models.Index(fields=['severity']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.created_at} {self.actor} {self.action}'

    def type(self):
        if self.action.startswith('AUTH_') or self.action in ('LOGIN', 'LOGOUT', 'REGISTER'):
            return 'auth'
        if self.action.startswith('DOCUMENT'):
            return 'document'
        if self.action.startswith('SHARE'):
            return 'share'
        if self.action.startswith('USER') or self.action.startswith('PASSWORD'):
            return 'user'
        return 'system'
