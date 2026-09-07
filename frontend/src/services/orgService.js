import api from './api';

export const orgService = {
  list: () => api.get('/organizations/'),
  create: (data) => api.post('/organizations/', data),
  myOrg: () => api.get('/organizations/my/'),
  updateOrg: (data) => api.patch('/organizations/my/', data),
  members: () => api.get('/organizations/my/members/'),
  addMember: (data) => api.post('/organizations/my/members/', data),
  updateMember: (userId, data) => api.patch(`/organizations/my/members/${userId}/`, data),
  removeMember: (userId) => api.delete(`/organizations/my/members/${userId}/`),
  invite: (data) => api.post('/organizations/my/invite/', data),
  acceptInvite: (token) => api.post(`/organizations/invitations/accept/${token}/`),
  orgDocuments: () => api.get('/organizations/my/documents/'),
  shareDocument: (docId) => api.post(`/organizations/my/documents/${docId}/`),
  unshareDocument: (docId) => api.delete(`/organizations/my/documents/${docId}/`),
};