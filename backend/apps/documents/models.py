from django.conf import settings
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

from .encryption import encrypt_bytes, decrypt_bytes, derive_key, wrap_key

User = get_user_model()


class Document(models.Model):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents',
    )
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('personal', 'Personal'),
        ('financial', 'Financial'),
        ('legal', 'Legal'),
        ('medical', 'Medical'),
        ('education', 'Education'),
        ('work', 'Work'),
        ('other', 'Other'),
    ]

    IMPORTANCE_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='general')
    importance = models.CharField(max_length=20, choices=IMPORTANCE_CHOICES, default='normal')

    # Encrypted file storage
    encrypted_file = models.BinaryField(null=True, blank=True)
    key_material = models.BinaryField(null=True, blank=True)
    nonce = models.BinaryField(null=True, blank=True)
    original_extension = models.CharField(max_length=20, blank=True)
    original_filename = models.CharField(max_length=255, blank=True)
    file_size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)
    checksum = models.CharField(max_length=64, blank=True)

    view_count = models.PositiveIntegerField(default=0)
    download_count = models.PositiveIntegerField(default=0)
    is_archived = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_deleted']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'importance']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_archived']),
        ]

    def __str__(self):
        return self.title

    def decrypt_content(self):
        """Decrypt the stored content using the per-document key."""
        if not self.encrypted_file:
            return b''
        key = derive_key(self.key_material)
        return decrypt_bytes(self.encrypted_file, key, self.nonce)

    def set_content(self, raw_bytes):
        """Encrypt and store raw content with a fresh per-document key.

        The key is stored wrapped by the server-side master key when configured.
        """
        key = derive_key()
        nonce, ciphertext, checksum = encrypt_bytes(raw_bytes, key)
        self.encrypted_file = ciphertext
        self.key_material = wrap_key(key)
        self.nonce = nonce
        self.checksum = checksum
        self.file_size = len(raw_bytes)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def mark_accessed(self):
        from django.db.models import F
        Document.objects.filter(pk=self.pk).update(
            view_count=F('view_count') + 1,
            last_accessed_at=timezone.now(),
        )


class DocumentVersion(models.Model):
    """Version history for a document (immutable snapshots)."""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    encrypted_file = models.BinaryField(null=True, blank=True)
    key_material = models.BinaryField(null=True, blank=True)
    nonce = models.BinaryField(null=True, blank=True)
    checksum = models.CharField(max_length=64, blank=True)
    file_size = models.BigIntegerField(default=0)
    change_summary = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_versions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document_versions'
        ordering = ['-version_number']
        unique_together = [('document', 'version_number')]
        indexes = [
            models.Index(fields=['document', 'version_number']),
        ]

    def __str__(self):
        return f'{self.document.title} v{self.version_number}'

    def decrypt_content(self):
        if not self.encrypted_file:
            return b''
        key = derive_key(self.key_material)
        return decrypt_bytes(self.encrypted_file, key, self.nonce)


class DocumentTag(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#1976d2')

    class Meta:
        db_table = 'document_tags'
        unique_together = [('user', 'name')]

    def __str__(self):
        return self.name


class DocumentTagLink(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='tag_links')
    tag = models.ForeignKey(DocumentTag, on_delete=models.CASCADE, related_name='document_links')

    class Meta:
        db_table = 'document_tag_links'
        unique_together = [('document', 'tag')]
