from rest_framework import serializers

from .models import Organization, OrganizationInvitation, OrganizationMember


class OrganizationSerializer(serializers.ModelSerializer):
    my_role = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'description', 'require_2fa',
            'allow_member_upload', 'is_active', 'created_at',
            'my_role', 'members_count',
        ]
        read_only_fields = ['id', 'slug', 'is_active', 'created_at']

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .services import my_role
            return my_role(request.user, obj)
        return None

    def get_members_count(self, obj):
        return obj.members.filter(is_active=True).count()


class MemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = OrganizationMember
        fields = ['id', 'user', 'username', 'email', 'first_name', 'last_name',
                  'role', 'is_active', 'joined_at']
        read_only_fields = ['id', 'user', 'joined_at']


class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationInvitation
        fields = ['id', 'organization', 'email', 'role', 'status', 'token', 'created_at']
        read_only_fields = ['id', 'organization', 'status', 'token', 'created_at']