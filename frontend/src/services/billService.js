import api from './api'

export const billService = {
  getAll:       (params) => api.get('/bills', { params }).then(r => r.data),
  getOne:       (id)     => api.get(`/bills/${id}`).then(r => r.data),
  create:       (data)   => api.post('/bills', data).then(r => r.data),
  update:       (id,data)=> api.put(`/bills/${id}`, data).then(r => r.data),
  delete:       (id)     => api.delete(`/bills/${id}`).then(r => r.data),
  duplicate:    (id)     => api.post(`/bills/${id}/duplicate`).then(r => r.data),
  getStats:     ()       => api.get('/bills/stats/summary').then(r => r.data),
  getNextNo:    (type)   => api.get(`/bills/next-number/${type}`).then(r => r.data),
  exportExcel:  (params) => api.get('/export/excel', { params, responseType: 'blob' }),
}

export const customerService = {
  getAll:   (params) => api.get('/customers', { params }).then(r => r.data),
  getOne:   (id)     => api.get(`/customers/${id}`).then(r => r.data),
  create:   (data)   => api.post('/customers', data).then(r => r.data),
  update:   (id,data)=> api.put(`/customers/${id}`, data).then(r => r.data),
  delete:   (id)     => api.delete(`/customers/${id}`).then(r => r.data),
}

export const productService = {
  getAll:   (params) => api.get('/products', { params }).then(r => r.data),
  create:   (data)   => api.post('/products', data).then(r => r.data),
  update:   (id,data)=> api.put(`/products/${id}`, data).then(r => r.data),
  delete:   (id)     => api.delete(`/products/${id}`).then(r => r.data),
}
