import logging
import time

logger = logging.getLogger('apps.requests')


class RequestLoggingMiddleware:
    """Log timing and basic info for each request."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start) * 1000
        logger.info(
            '%s %s %s %.2fms %s',
            request.method,
            request.path,
            response.status_code,
            duration_ms,
            request.META.get('REMOTE_ADDR', ''),
        )
        return response
