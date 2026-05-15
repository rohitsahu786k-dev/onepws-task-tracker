import api from './axiosInstance';

const endpoint = '/email-template';

export const emailTemplateApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = emailTemplateApi.list;
export const getById = emailTemplateApi.get;
export const create = emailTemplateApi.create;
export const update = emailTemplateApi.update;
export const remove = emailTemplateApi.remove;
export default emailTemplateApi;
