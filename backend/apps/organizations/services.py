import secrets

from django.utils.text import slugify

from .models import OrganizationMember


def generate_slug(name):
    from .models import Organization
    base = slugify(name) or 'org'
    slug = base
    while Organization.objects.filter(slug=slug).exists():
        slug = base + '-' + secrets.token_hex(2)[:4]
    return slug


def user_organization(user):
    """Return the user's active organization, or None."""
    membership = (
        OrganizationMember.objects
        .filter(user=user, is_active=True, organization__is_active=True)
        .select_related('organization')
        .first()
    )
    return membership.organization if membership else None


def my_role(user, organization):
    """Return the user's role inside a given organization, or None."""
    membership = OrganizationMember.objects.filter(
        user=user, organization=organization, is_active=True
    ).first()
    return membership.role if membership else None


def can_manage(user, organization):
    return my_role(user, organization) in ('owner', 'admin')


def can_admin(user, organization):
    return my_role(user, organization) == 'owner'


def can_upload(user, organization):
    role = my_role(user, organization)
    if role in ('owner', 'admin'):
        return True
    return role == 'member' and organization.allow_member_upload


def effective_role(user, organization):
    """Return a role AFTER org-level policies (2FA enforcement, upload)."""
    role = my_role(user, organization)
    if not role:
        return None
    if organization.require_2fa and not user.two_factor_enabled:
        return 'restricted'
    return role