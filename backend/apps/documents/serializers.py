from rest_framework import serializers

from .models import Document, DocumentTag, DocumentTagLink, DocumentVersion


class DocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'category', 'importance',
            'original_filename', 'original_extension', 'file_size', 'mime_type',
            'view_count', 'download_count', 'is_archived', 'is_favorite',
            'checksum', 'created_at', 'updated_at', 'last_accessed_at', 'file',
        ]
        read_only_fields = [
            'id', 'original_filename', 'original_extension', 'file_size',
            'mime_type', 'view_count', 'download_count', 'checksum',
            'created_at', 'updated_at', 'last_accessed_at',
        ]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError('Title cannot be blank.')
        return value.strip()


class DocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True, required=False)
    link = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Document
        fields = ['id', 'title', 'description', 'category', 'importance', 'file', 'link']
        read_only_fields = ['id']

    def create(self, validated_data):
        file = validated_data.pop('file', None)
        link = validated_data.pop('link', None)
        doc = Document(**validated_data)

        if link:
            url = link.strip()
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            doc.set_content(url.encode('utf-8'))
            doc.original_filename = url
            doc.original_extension = 'link'
            doc.mime_type = 'link'
            doc.checksum = doc.checksum or ''
            doc.save()
            return doc

        if not file:
            raise serializers.ValidationError({'file': 'A file or link is required.'})

        doc.original_filename = file.name
        doc.original_extension = file.name.rsplit('.', 1)[-1] if '.' in file.name else ''
        doc.mime_type = file.content_type or ''
        doc.set_content(file.read())
        doc.save()
        return doc


class DocumentVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentVersion
        fields = ['id', 'version_number', 'file_size', 'change_summary',
                  'created_by', 'created_at']
        read_only_fields = fields


class DocumentTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTag
        fields = ['id', 'name', 'color']
        read_only_fields = ['id']


class DocumentTagLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTagLink
        fields = ['id', 'document', 'tag']
