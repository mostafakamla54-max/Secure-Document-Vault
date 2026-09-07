from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from middleware.rate_limit import rate_limit

from apps.audit.models import AuditLog
from apps.documents.models import Document

from .models import Organization, OrganizationInvitation, OrganizationMember
from .serializers import (
    InvitationSerializer,
    MemberSerializer,
    OrganizationSerializer,
)
from .services import (
    can_admin,
    can_manage,
    can_upload,
    generate_slug,
    my_role,
    user_organization,
)

User = get_user_model()


def _log(request, action, object_type='organization', object_id=None, detail=''):
    AuditLog.objects.log(
        actor=request.user, action=action, object_type=object_type,
        object_id=object_id, detail=detail,
    )


class OrganizationView(APIView):
    """List the organizations the caller belongs to, or create a new one."""
    permission_classes = [permissions.IsAuthenticated]

    @rate_limit(calls=30, period=60)
    def get(self, request):
        orgs = Organization.objects.filter(
            members__user=request.user, members__is_active=True, is_active=True
        ).distinct()
        data = OrganizationSerializer(
            orgs, many=True, context={'request': request}
        ).data
        return Response(data)

    @rate_limit(calls=8, period=60)
    def post(self, request):
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'detail': 'Organization name is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if Organization.objects.filter(name__iexact=name).exists():
            return Response({'detail': 'An organization with this name already exists.'},
                            status=status.HTTP_400_BAD_REQUEST)
        org = Organization(
            name=name,
            description=(request.data.get('description') or '').strip(),
            created_by=request.user,
        )
        org.slug = generate_slug(name)
        org.save()
        OrganizationMember.objects.create(
            organization=org, user=request.user, role='owner', is_active=True
        )
        _log(request, 'ORGANIZATION_CREATED', 'organization', org.id,
             f'Created organization "{name}"')
        return Response(
            OrganizationSerializer(org, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class MyOrganizationView(APIView):
    """Retrieve or update the caller's organization (owner/admin only)."""
    permission_classes = [permissions.IsAuthenticated]

    def _org(self, request):
        org = user_organization(request.user)
        if not org:
            return None
        return org

    @rate_limit(calls=30, period=60)
    def get(self, request):
        org = self._org(request)
        if not org:
            return Response({'detail': 'No organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(OrganizationSerializer(org, context={'request': request}).data)

    @rate_limit(calls=15, period=60)
    def patch(self, request):
        org = self._org(request)
        if not org:
            return Response({'detail': 'No organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        if not can_manage(request.user, org):
            return Response({'detail': 'Admins only.'},
                            status=status.HTTP_403_FORBIDDEN)
        for field, cast in (
            ('name', str), ('description', str),
            ('require_2fa', bool), ('allow_member_upload', bool),
        ):
            if field in request.data:
                value = request.data[field]
                if cast is bool and not isinstance(value, bool):
                    return Response({field: 'Must be a boolean.'},
                                    status=status.HTTP_400_BAD_REQUEST)
                setattr(org, field, value)
        org.save()
        _log(request, 'ORGANIZATION_UPDATED', 'organization', org.id,
             'Updated organization settings')
        return Response(OrganizationSerializer(org, context={'request': request}).data)


class OrgMembersView(APIView):
    """List organization members or add a member (owner/admin)."""
    permission_classes = [permissions.IsAuthenticated]

    @rate_limit(calls=40, period=60)
    def get(self, request):
        org = user_organization(request.user)
        if not org:
            return Response({'detail': 'No organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        members = org.members.filter(is_active=True).select_related('user')
        return Response(MemberSerializer(members, many=True).data)

    @rate_limit(calls=15, period=60)
    def post(self, request):
        org = user_organization(request.user)
        if not org:
            return Response({'detail': 'No organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        if not can_manage(request.user, org):
            return Response({'detail': 'Admins only.'},
                            status=status.HTTP_403_FORBIDDEN)
        username = (request.data.get('username') or '').strip()
        role = (request.data.get('role') or 'member').strip()
        if role not in dict(OrganizationMember.ROLES):
            return Response({'detail': 'Invalid role.'},
                            status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(username__iexact=username).first()
        if not user:
            return Response({'detail': 'No user with that username.'},
                            status=status.HTTP_404_NOT_FOUND)
        existing_org = user_organization(user)
        if existing_org and existing_org.pk != org.pk:
            return Response({'detail': 'This user already belongs to another organization.'},
                            status=status.HTTP_400_BAD_REQUEST)
        membership, created = OrganizationMember.objects.get_or_create(
            organization=org, user=user,
            defaults={'role': role, 'is_active': True},
        )
        if not created:
            membership.is_active = True
            membership.role = role
            membership.save()
        _log(request, 'MEMBER_ADDED', 'organization', org.id,
             f'Added {user.username} as {role}')
        return Response(MemberSerializer(membership).data, status=status.HTTP_201_CREATED)


class OrgMemberDetailView(APIView):
    """Update a member's role/status or remove them (owner/admin)."""
    permission_classes = [permissions.IsAuthenticated]

    def _member(self, request, user_id):
        org = user_organization(request.user)
        if not org:
            return None, None
        member = org.members.filter(user_id=user_id).first()
        return org, member

    @rate_limit(calls=15, period=60)
    def patch(self, request, user_id):
        org, member = self._member(request, user_id)
        if not org:
            return Response({'detail': 'No organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        if not can_manage(request.user, org):
            return Response({'detail': 'Admins only.'},
                            status=status.HTTP_403_FORBIDDEN)
        if not member:
            return Response({'detail': 'Member not found.'},
                            status=status.HTTP_404_NOT_FOUND)
        if 'role' in request.data:
            role = request.data['role']
            if role not in dict(OrganizationMember.ROLES):
                return Response({'detail': 'Invalid role.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if member.role == 'owner':
                return Response({'detail': 'The owner role cannot be changed.'},
                                status=status.HTTP_400_BAD_REQUEST)
            member.role = role
        if 'is_active' in request.data and isinstance(request.data['is_active'], bool):
            member.is_active = request.data['is_active']
        member.save()
        _log(request, 'MEMBER_UPDATED', 'organization', org.id,
             f'Updated {member.user.username} role={member.role} active={member.is_active}')
        return Response(MemberSerializer(member).data)

    @rate_limit(calls=15, period=60)
    def delete(self, request, user_id):
        org, member = self._member(request, user_id)
        if not org:
            return Response({'detail': 'No organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        if not can_manage(request.user, org):
            return Response({'detail': 'Admins only.'},
                            status=status.HTTP_403_FORBIDDEN)
        if not member:
            return Response({'detail': 'Member not found.'},
                            status=status.HTTP_404_NOT_FOUND)
        if member.role == 'owner':
            return Response({'detail': 'The owner cannot be removed.'},
                            status=status.HTTP_400_BAD_REQUEST)
        username = member.user.username
        member.delete()
        _log(request, 'MEMBER_REMOVED', 'organization', org.id,
             f'Removed {username}')
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrgInviteCreateView(APIView):
    """Send an organization invitation by email (owner/admin)."""
    permission_classes = [permissions.IsAuthenticated]

    @rate_limit(calls=8, period=60)
    def post(self, request):
        org = user_organization(request.user)
        if not org:
            return Response({'detail': 'No organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        if not can_manage(request.user, org):
            return Response({'detail': 'Admins only.'},
                            status=status.HTTP_403_FORBIDDEN)
        email = (request.data.get('email') or '').strip().lower()
        role = (request.data.get('role') or 'member').strip()
        if not email or '@' not in email:
            return Response({'detail': 'A valid email is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if role not in dict(OrganizationMember.ROLES):
            return Response({'detail': 'Invalid role.'},
                            status=status.HTTP_400_BAD_REQUEST)
        invite = OrganizationInvitation(
            organization=org, email=email, role=role,
            created_by=request.user,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        invite.save()
        _log(request, 'ORG_INVITE_CREATED', 'organization', org.id,
             f'Invited {email} as {role}')
        return Response(InvitationSerializer(invite).data, status=status.HTTP_201_CREATED)


class OrgInviteAcceptView(APIView):
    """Accept an invitation by its token and join the organization."""
    permission_classes = [permissions.IsAuthenticated]

    @rate_limit(calls=8, period=60)
    def post(self, request, token):
        invite = OrganizationInvitation.objects.filter(token=token).first()
        if not invite:
            return Response({'detail': 'Invalid invitation token.'},
                            status=status.HTTP_404_NOT_FOUND)
        if invite.status != 'pending':
            return Response({'detail': 'This invitation was already used.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if invite.is_expired():
            return Response({'detail': 'This invitation has expired.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if request.user.email.lower() != invite.email.lower():
            return Response({'detail': 'This invitation is for a different email.'},
                            status=status.HTTP_403_FORBIDDEN)
        existing_org = user_organization(request.user)
        if existing_org and existing_org.pk != invite.organization.pk:
            return Response({'detail': 'You already belong to another organization.'},
                            status=status.HTTP_400_BAD_REQUEST)
        membership, _ = OrganizationMember.objects.get_or_create(
            organization=invite.organization, user=request.user,
            defaults={'role': invite.role, 'is_active': True},
        )
        membership.is_active = True
        membership.role = invite.role
        membership.save()
        invite.status = 'accepted'
        invite.accepted_by = request.user
        invite.save()
        _log(request, 'ORG_INVITE_ACCEPTED', 'organization', invite.organization.id,
             f'{request.user.username} accepted invitation for {invite.email}')
        return Response(OrganizationSerializer(
            invite.organization, context={'request': request}
        ).data)


class OrgDocumentsView(APIView):
    """List org-shared documents, share a document with the org, or unshare."""
    permission_classes = [permissions.IsAuthenticated]

    @rate_limit(calls=60, period=60)
    def get(self, request):
        org = user_organization(request.user)
        if not org:
            return Response({'detail': 'No organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        docs = Document.objects.filter(
            organization=org, is_deleted=False
        ).order_by('-created_at')
        payload = []
        for d in docs:
            payload.append({
                'id': d.id,
                'title': d.title,
                'category': d.category or '',
                'importance': d.importance or '',
                'owner': d.user.username,
                'created_at': d.created_at.isoformat() if d.created_at else None,
                'file_size': d.file_size or 0,
            })
        return Response(payload)

    @rate_limit(calls=10, period=60)
    def post(self, request, doc_id):
        org = user_organization(request.user)
        if not org:
            return Response({'detail': 'No organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        role = my_role(request.user, org)
        if role == 'restricted':
            return Response({'detail': 'Enable 2FA to use organization features.'},
                            status=status.HTTP_403_FORBIDDEN)
        if not can_upload(request.user, org):
            return Response({'detail': 'Only admins can share documents here.'},
                            status=status.HTTP_403_FORBIDDEN)
        doc = Document.objects.filter(
            pk=doc_id, user=request.user, is_deleted=False
        ).first()
        if not doc:
            return Response({'detail': 'Document not found.'},
                            status=status.HTTP_404_NOT_FOUND)
        doc.organization = org
        doc.save(update_fields=['organization'])
        _log(request, 'ORG_DOCUMENT_SHARED', 'document', doc.id,
             f'Shared "{doc.title}" with {org.name}')
        return Response({'detail': 'Document shared with the organization.'},
                        status=status.HTTP_200_OK)

    @rate_limit(calls=10, period=60)
    def delete(self, request, doc_id):
        org = user_organization(request.user)
        if not org:
            return Response({'detail': 'No organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        doc = Document.objects.filter(pk=doc_id, is_deleted=False).first()
        if not doc or doc.organization_id != org.pk:
            return Response({'detail': 'Document not shared with this organization.'},
                            status=status.HTTP_404_NOT_FOUND)
        if not (can_manage(request.user, org) or doc.user_id == request.user.id):
            return Response({'detail': 'Not allowed to unshare this document.'},
                            status=status.HTTP_403_FORBIDDEN)
        doc.organization = None
        doc.save(update_fields=['organization'])
        _log(request, 'ORG_DOCUMENT_UNSHARED', 'document', doc.id,
             f'Removed "{doc.title}" from {org.name}')
        return Response(status=status.HTTP_204_NO_CONTENT)