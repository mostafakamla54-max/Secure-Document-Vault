from rest_framework import serializers

from .models import DocumentShare, ShareInvitation


def generate_share_token():
    import secrets
    return secrets.token_urlsafe(48)


class DocumentShareSerializer(serializers.ModelSerializer):
    access_url = serializers.SerializerMethodField()
    shared_by = serializers.SerializerMethodField()
    shared_by_name = serializers.SerializerMethodField()
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = DocumentShare
        fields = [
            'id', 'document', 'document_title', 'shared_by', 'shared_by_name',
            'shared_with', 'email', 'permission', 'message',
            'expires_at', 'is_active', 'is_viewed', 'view_count',
            'max_opens', 'download_allowed', 'access_url', 'created_at',
            'last_accessed_at',
        ]
        read_only_fields = fields

    def get_access_url(self, obj):
        return '/shared/' + obj.access_token + '/'

    def get_shared_by(self, obj):
        return obj.shared_by.username

    def get_shared_by_name(self, obj):
        return obj.shared_by.get_full_name() or obj.shared_by.username


class ShareCreateSerializer(serializers.Serializer):
    document_id = serializers.IntegerField()
    permission = serializers.ChoiceField(
        choices=DocumentShare.PERMISSION_CHOICES, default='view'
    )
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    message = serializers.CharField(required=False, allow_blank=True, default='')
    expires_at = serializers.DateTimeField(required=False, allow_null=True, default=None)


class ShareInvitationSerializer(serializers.ModelSerializer):
    share_document = serializers.CharField(source='share.document.title', read_only=True)
    shared_by = serializers.CharField(source='share.shared_by.username', read_only=True)

    class Meta:
        model = ShareInvitation
        fields = ['id', 'share', 'share_document', 'shared_by', 'token',
                  'status', 'email', 'created_at', 'accepted_at']
        read_only_fields = fields