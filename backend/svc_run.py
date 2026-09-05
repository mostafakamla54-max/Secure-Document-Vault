"""Bootstrapper that serves the Django app via Waitress (HTTP).

Waitress does not do TLS itself. For real HTTPS in production, put Nginx
(or any TLS reverse proxy) in front of this server on port 8000 with a
Let's Encrypt certificate.
"""
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

if __name__ == '__main__':
    from waitress import serve
    from config.wsgi import application

    serve(
        application,
        host='0.0.0.0',
        port=8000,
        threads=8,
        channel_timeout=120,
        max_request_body_size=1073741824,
        clear_untrusted_proxy_headers=False,
    )