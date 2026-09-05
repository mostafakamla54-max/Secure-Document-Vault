import api from './api';

export const documentService = {
  list: (params) => api.get('/documents/', { params }),
  get: (id) => api.get(`/documents/${id}/`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => api.patch(`/documents/${id}/`, data),
  remove: (id) => api.delete(`/documents/${id}/`),
  download: (id) => api.get(`/documents/download/${id}/`, { responseType: 'blob' }),
  getEncrypted: (id) => api.get(`/documents/encrypted-text/${id}/`),
  decryptText: (id) => api.post(`/documents/decrypt-text/${id}/`),
  analyze: (id) => api.post(`/documents/ai/analyze/${id}/`),
  toggleFavorite: (id) => api.post(`/documents/favorite/${id}/`),
  toggleArchive: (id) => api.post(`/documents/archive/${id}/`),
  getTrash: () => api.get('/documents/trash/'),
  restore: (id) => api.post(`/documents/trash/${id}/`),
  purge: (id) => api.delete(`/documents/trash/${id}/`),
  getVersions: (id) => api.get(`/documents/documents/${id}/versions/`),
};
