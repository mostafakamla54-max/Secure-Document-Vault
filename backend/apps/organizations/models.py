import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

User = settings.AUTH_USER_MODEL


class Organization(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    require_2fa = models.BooleanField(
        default=False,
        help_text='Force all members to enable two-factor authentication.',
    )
    allow_member_upload = models.BooleanField(
        default=True,
        help_text='Allow regular members to upload documents to the organization.',
    )
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='organizations_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organizations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name

    def generate_slug(self):
        base = slugify(self.name) or 'org'
        slug = base
        while Organization.objects.filter(slug=slug).exists():
            slug = base + '-' + secrets.token_hex(2)[:4]
        return slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_slug()
        super().save(*args, **kwargs)


class OrganizationMember(models.Model):
    ROLES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='members'
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='organization_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLES, default='member')
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'organization_members'
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'user'], name='unique_org_member'
            ),
        ]
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['organization', 'role']),
        ]

    def __str__(self):
        return f'{self.organization.name} :: {self.user.username} ({self.role})'


class OrganizationInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='invitations'
    )
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=OrganizationMember.ROLES, default='member')
    token = models.CharField(max_length=64, unique=True, default=secrets.token_hex)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='invitations_created'
    )
    accepted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='invitations_accepted'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'organization_invitations'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.organization.name} -> {self.email} ({self.status})'

    def is_expired(self):
        return self.expires_at < timezone.now()