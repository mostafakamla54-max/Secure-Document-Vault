from django.urls import path

from .views import (
    MyOrganizationView,
    OrgDocumentsView,
    OrgInviteAcceptView,
    OrgInviteCreateView,
    OrgMemberDetailView,
    OrgMembersView,
    OrganizationView,
)

app_name = 'organizations'

urlpatterns = [
    path('', OrganizationView.as_view(), name='organizations-list-create'),
    path('my/', MyOrganizationView.as_view(), name='organization-my'),
    path('my/members/', OrgMembersView.as_view(), name='organization-members'),
    path('my/members/<int:user_id>/', OrgMemberDetailView.as_view(), name='organization-member-detail'),
    path('my/invite/', OrgInviteCreateView.as_view(), name='organization-invite'),
    path('my/documents/', OrgDocumentsView.as_view(), name='organization-documents'),
    path('my/documents/<int:doc_id>/', OrgDocumentsView.as_view(), name='organization-document-share'),
    path('invitations/accept/<str:token>/', OrgInviteAcceptView.as_view(), name='organization-invite-accept'),
]