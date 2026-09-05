# -*- coding: utf-8 -*-
"""Live multipart upload test that proves encryption at write-time."""
import urllib.request
import urllib.error
import json
import uuid
import os


def api(method, path, headers=None, data=None, files=None):
    h = dict(headers or {})
    body = None
    if data or files:
        boundary = '----B' + uuid.uuid4().hex
        body = b''
        if data:
            for k, v in data.items():
                body += ('--%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s\r\n'
                         % (boundary, k, v)).encode()
        if files:
            for k, (fn, content, ctype) in files.items():
                body += ('--%s\r\nContent-Disposition: form-data; name="%s"; filename="%s"\r\n'
                         'Content-Type: %s\r\n\r\n' % (boundary, k, fn, ctype)).encode() + content + b'\r\n'
        body += ('--%s--\r\n' % boundary).encode()
        h['Content-Type'] = 'multipart/form-data; boundary=' + boundary
    req = urllib.request.Request('http://localhost:8000' + path, data=body,
                                 method=method, headers=h)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def main():
    body = json.dumps({'username': 'tester39738', 'password': 'Str@ng2026x'}).encode()
    req = urllib.request.Request('http://localhost:8000/api/v1/accounts/login/', data=body,
                                 method='POST', headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        tok = json.loads(r.read().decode())['access']
    H = {'Authorization': 'Bearer ' + tok}

    st, resp = api('POST', '/api/v1/documents/', headers=H,
                   data={'title': 'LiveUploadCheck', 'category': 'work',
                         'importance': 'normal', 'description': 'live multipart proof'},
                   files={'file': ('live.txt', b'TOP-SECRET-LIVE-UPLOAD-777', 'text/plain')})
    print('CREATE_STATUS=' + str(st))
    print('RESP_RAW=' + (resp[:300]))
    rid = None
    try:
        jr = json.loads(resp)
        rid = jr.get('id') or (jr.get('data') or {}).get('id')
    except Exception:
        rid = None
    print('NEW_ID=' + str(rid))

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    import django
    django.setup()
    from apps.documents.models import Document
    d = Document.objects.filter(pk=rid).first()
    if d:
        print('OK_BYTES=' + str(isinstance(d.encrypted_file, bytes)))
        print('PLAIN_IN_BLOB=' + str(b'TOP-SECRET-LIVE-UPLOAD-777' in d.encrypted_file))
        print('ROUNDTRIP=' + str(d.decrypt_content() == b'TOP-SECRET-LIVE-UPLOAD-777'))
        api('DELETE', '/api/v1/documents/%s/' % rid, headers=H)
    print('CLEANED=1')


if __name__ == '__main__':
    main()