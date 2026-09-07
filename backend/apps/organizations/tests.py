from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.documents.models import Document

from .models import Organization, OrganizationMember

User = get_user_model()


class OrganizationTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='orgowner', email='owner@example.com', password='TestPass123!'
        )
        self.admin = User.objects.create_user(
            username='orgadmin', email='admin@example.com', password='TestPass123!'
        )
        self.member = User.objects.create_user(
            username='orgmember', email='member@example.com', password='TestPass123!'
        )
        self.other = User.objects.create_user(
            username='outsider', email='outsider@example.com', password='TestPass123!'
        )

    def _client(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    def _create_org(self, client=None):
        client = client or self._client(self.owner)
        resp = client.post(reverse('organizations:organizations-list-create'), {'name': 'Acme Corp'})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        return resp.data['id'], Organization.objects.get(pk=resp.data['id'])

    def test_create_organization_makes_owner(self):
        client = self._client(self.owner)
        resp = client.post(reverse('organizations:organizations-list-create'), {'name': 'Test Ltd'})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Organization.objects.count(), 1)
        membership = OrganizationMember.objects.get(user=self.owner)
        self.assertEqual(membership.role, 'owner')

    def test_admin_may_add_member(self):
        org_id, _ = self._create_org()
        client = self._client(self.owner)
        resp = client.post(reverse('organizations:organization-members'), {
            'username': 'orgmember', 'role': 'member',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(OrganizationMember.objects.filter(
            organization_id=org_id, user=self.member, role='member'
        ).exists())

    def test_outsider_cannot_add_members(self):
        self._create_org()
        client = self._client(self.other)
        resp = client.post(reverse('organizations:organization-members'), {
            'username': 'orgmember', 'role': 'member',
        })
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_member_cannot_manage_others(self):
        self._create_org()
        OrganizationMember.objects.create(
            organization=Organization.objects.get(name='Acme Corp'),
            user=self.member, role='member',
        )
        client = self._client(self.member)
        resp = client.post(reverse('organizations:organization-members'), {
            'username': 'outside', 'role': 'member',
        })
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_role_cannot_be_changed(self):
        org_id, _ = self._create_org()
        client = self._client(self.owner)
        resp = client.patch(reverse('organizations:organization-member-detail',
                                    kwargs={'user_id': self.owner.id}), {'role': 'admin'})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invitation_flow(self):
        self._create_org()
        org = Organization.objects.get(name='Acme Corp')
        client = self._client(self.owner)
        resp = client.post(reverse('organizations:organization-invite'), {
            'email': 'invited@example.com', 'role': 'member',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        invited = User.objects.create_user(
            username='invited', email='invited@example.com', password='TestPass123!'
        )
        inv = org.invitations.first()
        invite_client = self._client(invited)
        resp = invite_client.post(reverse('organizations:organization-invite-accept',
                                          kwargs={'token': inv.token}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(OrganizationMember.objects.filter(
            organization=org, user=invited
        ).exists())

    def test_share_and_list_org_documents(self):
        org_id, _ = self._create_org()
        doc = Document.objects.create(
            user=self.owner, title='Board minutes',
            category='work', importance='high',
        )
        client = self._client(self.owner)
        resp = client.post(reverse('organizations:organization-document-share',
                                   kwargs={'doc_id': doc.id}))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        doc.refresh_from_db()
        self.assertEqual(doc.organization_id, org_id)

        member_membership = OrganizationMember.objects.create(
            organization=Organization.objects.get(pk=org_id),
            user=self.member, role='member',
        )
        member_client = self._client(self.member)
        resp = member_client.get(reverse('organizations:organization-documents'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

        # A member can unshare their own document only; this one belongs to owner.
        resp = member_client.delete(reverse('organizations:organization-document-share',
                                            kwargs={'doc_id': doc.id}))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # An admin can unshare any org document.
        admin_membership = OrganizationMember.objects.create(
            organization=Organization.objects.get(pk=org_id),
            user=self.admin, role='admin',
        )
        admin_client = self._client(self.admin)
        resp = admin_client.delete(reverse('organizations:organization-document-share',
                                           kwargs={'doc_id': doc.id}))
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)