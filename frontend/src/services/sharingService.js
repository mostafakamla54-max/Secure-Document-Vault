import api from './api';

export const sharingService = {
  list: () => api.get('/sharing/'),
  create: (data) => api.post('/sharing/', data),
  revoke: (id) => api.delete(`/sharing/${id}/`),
  received: () => api.get('/sharing/received/'),
  getPublic: (token) => api.get(`/sharing/public/${token}/`),
  getPublicDownload: (token) => api.get(`/sharing/public/${token}/?download=1`, { responseType: 'blob' }),
  inviteReceived: () => api.get('/sharing/invitations/'),
};
