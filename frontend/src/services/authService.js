import api from './api';

export const authService = {
  register: (data) => api.post('/accounts/register/', data),
  login: (data) => api.post('/accounts/login/', data),
  login2fa: (data) => api.post('/accounts/login/2fa/', data),
  logout: (data) => api.post('/accounts/logout/', data),
  getProfile: () => api.get('/accounts/profile/'),
  updateProfile: (data) => api.patch('/accounts/profile/', data),
  uploadAvatar: (formData) => api.patch('/accounts/profile/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.post('/accounts/change-password/', data),
  requestPasswordReset: (data) => api.post('/accounts/password-reset/', data),
  confirmPasswordReset: (data) => api.post('/accounts/password-reset/confirm/', data),
  getNotifications: () => api.get('/accounts/notifications/'),
  getSessions: () => api.get('/accounts/sessions/'),
  get2faStatus: () => api.get('/accounts/2fa/status/'),
  setup2fa: () => api.post('/accounts/2fa/setup/'),
  enable2fa: (code) => api.post('/accounts/2fa/enable/', { code }),
  disable2fa: (code) => api.post('/accounts/2fa/disable/', { code }),
};
