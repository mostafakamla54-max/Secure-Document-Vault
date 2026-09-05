from celery import shared_task

from django.utils import timezone

from .models import Document


@shared_task
def purge_soft_deleted(days=30):
    """Permanently delete documents soft-deleted longer than `days` ago."""
    cutoff = timezone.now() - timezone.timedelta(days=days)
    qs = Document.objects.filter(is_deleted=True, deleted_at__lte=cutoff)
    count = qs.count()
    qs.delete()
    return f'Purged {count} documents'


@shared_task
def prune_old_versions(keep_last=10):
    """Delete document versions beyond the most recent `keep_last` per document."""
    from .models import DocumentVersion
    removed = 0
    for doc in Document.objects.all():
        versions = list(
            DocumentVersion.objects.filter(document=doc)
            .order_by('-version_number')
            .values_list('id', flat=True)
        )
        if len(versions) > keep_last:
            stale = versions[keep_last:]
            removed += DocumentVersion.objects.filter(id__in=stale).delete()[0]
    return f'Pruned {removed} old versions'
