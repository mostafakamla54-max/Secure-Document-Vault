from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    InvitationViewSet,
    PublicShareAccessView,
    ReceivedSharesView,
    ShareAnalyticsView,
    ShareViewSet,
)

router = DefaultRouter()
router.register(r'', ShareViewSet, basename='shares')

urlpatterns = [
    path('received/', ReceivedSharesView.as_view(), name='received-shares'),
    path('public/<str:token>/', PublicShareAccessView.as_view(), name='public-share'),
    path('analytics/<int:pk>/', ShareAnalyticsView.as_view(), name='share-analytics'),
    path('invitations/',
         InvitationViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='invitations'),
    path('', include(router.urls)),
]
