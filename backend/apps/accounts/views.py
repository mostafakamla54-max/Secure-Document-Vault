from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import ActiveSession, Notification
from .serializers import (
    ActiveSessionSerializer,
    ChangePasswordSerializer,
    LoginSerializer,
    NotificationSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)
from .services import (
    is_account_locked,
    create_active_session,
    lock_account_after_failures,
    reset_failed_login,
    send_verification_email,
    send_password_reset_email,
    verify_account,
    verify_reset_token,
)
from utils.helpers import get_client_ip, standard_response
from middleware.rate_limit import rate_limit

User = get_user_model()


@rate_limit(calls=10, period=60)
class RegisterView(generics.CreateAPIView):
    """Register a new user account."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            standard_response(success=True, message='تم إنشاء الحساب بنجاح'),
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        valid = verify_account(token)
        if valid:
            return Response(standard_response(success=True, message='Email verified successfully.'))
        return Response(
            standard_response(success=False, message='Invalid or expired verification token.'),
            status=status.HTTP_400_BAD_REQUEST,
        )


@rate_limit(calls=10, period=60)
class LoginView(TokenObtainPairView):
    """Login with username/email and password."""
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        identifier = (request.data.get('username', '') or request.data.get('email', '')).strip()
        password = request.data.get('password', '')
        if not identifier or not password:
            return Response(
                standard_response(success=False, message='اسم المستخدم وكلمة المرور مطلوبان'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = (
            User.objects.filter(username__iexact=identifier).first()
            or User.objects.filter(email__iexact=identifier).first()
        )

        if user is None:
            return Response(
                standard_response(success=False, message='اسم المستخدم أو كلمة المرور غير صحيحة'),
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if is_account_locked(user):
            return Response(
                standard_response(success=False, message='تجاوزت عدد المحاولات، حاول بعد 5 دقائق'),
                status=status.HTTP_423_LOCKED,
            )

        if not check_password(password, user.password):
            lock_account_after_failures(user)
            return Response(
                standard_response(success=False, message='اسم المستخدم أو كلمة المرور غير صحيحة'),
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                standard_response(success=False, message='هذا الحساب معطّل'),
                status=status.HTTP_403_FORBIDDEN,
            )

        reset_failed_login(user)
        refresh = LoginSerializer.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        create_active_session(user, request)
        return Response(data)


@rate_limit(calls=30, period=60)
class LogoutView(APIView):
    """Logout: blacklist refresh token and close the active session."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get('refresh')
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except Exception:
                pass
        ActiveSession.objects.filter(user=request.user, is_active=True).update(is_active=False)
        return Response(standard_response(success=True, message='Logged out successfully.'))


class ProfileView(generics.RetrieveUpdateAPIView):
    """View and update the current user's profile."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not check_password(serializer.validated_data['old_password'], user.password):
            return Response(
                standard_response(success=False, message='Old password is incorrect.'),
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data['new_password'])
        user.password_changed_at = timezone.now()
        user.save()
        return Response(standard_response(success=True, message='Password changed successfully.'))


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            send_password_reset_email(user, request)
        except User.DoesNotExist:
            pass
        return Response(standard_response(success=True, message='If the email exists, a reset link was sent.'))


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = verify_reset_token(serializer.validated_data['token'])
        if not user:
            return Response(
                standard_response(success=False, message='Invalid or expired token.'),
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data['new_password'])
        user.password_reset_token = ''
        user.password_reset_expires = None
        user.password_changed_at = timezone.now()
        user.save()
        return Response(standard_response(success=True, message='Password reset successfully.'))


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        unread = queryset.filter(is_read=False).count()
        data = self.get_serializer(queryset, many=True).data
        return Response({'results': data, 'unread_count': unread})

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ActiveSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ActiveSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ActiveSession.objects.filter(user=self.request.user, is_active=True)

    def destroy(self, request, *args, **kwargs):
        session = self.get_object()
        session.is_active = False
        session.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)
