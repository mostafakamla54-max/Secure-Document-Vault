"""Real Windows service for the Secure Document Vault (Waitress + Django).

Install:
    python vault_service.py install
Uninstall:
    python vault_service.py remove
Start:
    sc start SecureVaultService
"""
import os
import sys
import threading

from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
os.chdir(BACKEND_DIR)
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import servicemanager
import win32event
import win32service
import win32serviceutil

from waitress import serve

SERVICE_NAME = 'SecureVaultService'
SERVICE_DISPLAY = 'Secure Document Vault Server'


class VaultService(win32serviceutil.ServiceFramework):
    _svc_name_ = SERVICE_NAME
    _svc_display_name_ = SERVICE_DISPLAY
    _svc_description_ = 'Persistent encrypted document vault web server (Waitress).'

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        self._server_thread = None

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)

    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, ''),
        )
        self.main()

    def main(self):
        from config.wsgi import application

        def _serve():
            serve(
                application,
                host='127.0.0.1',
                port=8000,
                threads=16,
                channel_timeout=120,
                max_request_body_size=1073741824,
                clear_untrusted_proxy_headers=False,
            )

        self._server_thread = threading.Thread(target=_serve, daemon=True)
        self._server_thread.start()
        # Block the main service thread until a stop is requested.
        win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)
        self.ReportServiceStatus(win32service.SERVICE_STOPPED)


if __name__ == '__main__':
    win32serviceutil.HandleCommandLine(VaultService)