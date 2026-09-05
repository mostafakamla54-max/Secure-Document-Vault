import time
from functools import wraps

from django.core.cache import cache
from django.http import JsonResponse

from utils.helpers import get_client_ip, standard_response


class RateLimitExceeded(Exception):
    pass


class RateLimitMiddleware:
    """Simple in-memory/cache rate limiting keyed by IP."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response


def rate_limit(calls=10, period=60):
    """Decorator-based rate limit that works on both functions and APIView classes.

    Usage (on a view method):
        @rate_limit(calls=5, period=60)
        def post(self, request): ...

    Usage (on an APIView/class-based view):
        @rate_limit(calls=5, period=60)
        class LoginView(View): ...
    """
    def decorator(target):
        # Class-based view: wrap its `dispatch` method.
        if isinstance(target, type):
            original_dispatch = target.dispatch

            @wraps(original_dispatch)
            def wrapped_dispatch(self, request, *args, **kwargs):
                ip = get_client_ip(request)
                key = f'ratelimit:{target.__name__}:{request.method}:{ip}'
                hits = cache.get(key, 0)
                if hits >= calls:
                    return JsonResponse(
                        standard_response(success=False, message='تجاوزت عدد المحاولات، حاول بعد 5 دقائق'),
                        status=429,
                    )
                cache.set(key, hits + 1, timeout=period)
                return original_dispatch(self, request, *args, **kwargs)

            target.dispatch = wrapped_dispatch
            return target

        # Plain view function.
        @wraps(target)
        def wrapper(view, request, *args, **kwargs):
            ip = get_client_ip(request)
            key = f'ratelimit:{view.__class__.__name__}:{target.__name__}:{ip}'
            hits = cache.get(key, 0)
            if hits >= calls:
                return JsonResponse(
                    standard_response(success=False, message='تجاوزت عدد المحاولات، حاول بعد 5 دقائق'),
                    status=429,
                )
            cache.set(key, hits + 1, timeout=period)
            return target(view, request, *args, **kwargs)
        return wrapper
    return decorator
