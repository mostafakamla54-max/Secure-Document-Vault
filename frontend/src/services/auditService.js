import api from './api';

export const auditService = {
  list: (params) => api.get('/audit/logs/', { params }),
  myLogs: () => api.get('/audit/my-logs/'),
  securityDashboard: () => api.get('/audit/security/dashboard/'),
};
