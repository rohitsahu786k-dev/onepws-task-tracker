import api from './axiosInstance';

const endpoint = '/task-template';

export const taskTemplateApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = taskTemplateApi.list;
export const getById = taskTemplateApi.get;
export const create = taskTemplateApi.create;
export const update = taskTemplateApi.update;
export const remove = taskTemplateApi.remove;
export default taskTemplateApi;
