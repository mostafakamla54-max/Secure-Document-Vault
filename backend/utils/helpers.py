from rest_framework.views import exception_handler


def standard_response(success, message='', data=None, errors=None):
    """Normalize API responses to a consistent envelope."""
    payload = {'success': success, 'message': message}
    if data is not None:
        payload['data'] = data
    if errors is not None:
        payload['errors'] = errors
    return payload


def get_client_ip(request):
    """Extract the real client IP from common proxy headers."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def custom_exception_handler(exc, context):
    """Custom DRF exception handler that wraps errors in the standard envelope."""
    response = exception_handler(exc, context)
    if response is not None:
        original = response.data
        response.data = standard_response(
            success=False,
            message=str(exc),
            errors=original if isinstance(original, dict) else {'non_field_errors': original},
        )
    return response
