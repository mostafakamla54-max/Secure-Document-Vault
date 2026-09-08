from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Notification, ActiveSession
from .validators import validate_password_strength, validate_phone_number

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    document_count = serializers.SerializerMethodField()
    share_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone_number',
            'organization', 'profile_image', 'two_factor_enabled', 'email_verified',
            'is_staff', 'is_superuser',
            'created_at', 'document_count', 'share_count',
        ]
        read_only_fields = ['id', 'email_verified', 'created_at', 'document_count', 'share_count']

    def get_document_count(self, obj):
        return obj.documents.filter(is_deleted=False).count()

    def get_share_count(self, obj):
        from apps.sharing.models import DocumentShare
        return DocumentShare.objects.filter(shared_by=obj, is_active=True).count()


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True, max_length=150)
    password = serializers.CharField(write_only=True, validators=[validate_password_strength])
    password_confirm = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, validators=[validate_phone_number])

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'phone_number',
                  'organization', 'password', 'password_confirm']
        extra_kwargs = {
            'email': {
                'validators': [],
            },
            'username': {
                'validators': [],
            },
            'first_name': {
                'required': False,
                'allow_blank': True,
            },
            'last_name': {
                'required': False,
                'allow_blank': True,
            },
            'organization': {
                'required': False,
                'allow_blank': True,
            },
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'كلمتا المرور غير متطابقتين'})

        email = attrs.get('email')
        username = (attrs.get('username') or '').strip() or (email or '').strip().lower()
        attrs['username'] = username

        if username and User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError({'username': 'اسم المستخدم موجود مسبقاً'})
        if email and User.objects.filter(email__iexact=email.strip().lower()).exists():
            raise serializers.ValidationError({'email': 'البريد الإلكتروني مستخدم، استخدم بريداً آخر'})

        return attrs

    def validate_username(self, value):
        value = value.strip()
        if value and User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('اسم المستخدم موجود مسبقاً')
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('البريد الإلكتروني مستخدم، استخدم بريداً آخر')
        return value

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        username = validated_data.get('username', '').strip()
        email = validated_data.get('email', '').strip().lower()

        # Guard: never create a duplicate even in a race condition.
        existing = User.objects.filter(
            username__iexact=username
        ).first() or User.objects.filter(email__iexact=email).first()
        if existing:
            raise serializers.ValidationError({
                'username': 'اسم المستخدم أو البريد الإلكتروني موجود مسبقاً'
            })

        user = User(**validated_data)
        user.set_password(password)
        user.is_active = True
        user.email_verified = True
        user.save()
        return user


class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        return token


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password_strength])
    new_password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password_strength])
    new_password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Passwords do not match.'})
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'link', 'is_read', 'read_at',
                  'created_at', 'priority']
        read_only_fields = fields


class ActiveSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActiveSession
        fields = ['id', 'ip_address', 'user_agent', 'device_type', 'browser',
                  'os', 'location', 'expires_at', 'created_at', 'last_activity']
        read_only_fields = fields
