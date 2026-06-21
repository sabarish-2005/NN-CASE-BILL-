import api from './api';

export const laborService = {
  getAll: () => api.get('/labors').then(res => res.data),
  getOne: (id) => api.get(`/labors/${id}`).then(res => res.data),
  create: (data) => api.post('/labors', data).then(res => res.data),
  update: (id, data) => api.put(`/labors/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/labors/${id}`).then(res => res.data),
  
  // Work records
  addWork: (id, data) => api.post(`/labors/${id}/work`, data).then(res => res.data),
  updateWork: (id, data) => api.put(`/labors/${id}/work`, data).then(res => res.data),
  deleteWork: (id, recordId) => api.delete(`/labors/${id}/work`, { data: { recordId } }).then(res => res.data),
  
  // Summary/reports
  getSummary: (from, to) => api.get('/labors/summary', { params: { from, to } }).then(res => res.data),
};
