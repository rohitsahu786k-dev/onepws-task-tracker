import api from './axiosInstance';

const endpoint = '/notification-template';

export const notificationTemplateApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = notificationTemplateApi.list;
export const getById = notificationTemplateApi.get;
export const create = notificationTemplateApi.create;
export const update = notificationTemplateApi.update;
export const remove = notificationTemplateApi.remove;
export default notificationTemplateApi;
