import api from './axiosInstance';

const endpoint = '/task';

export const taskApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = taskApi.list;
export const getById = taskApi.get;
export const create = taskApi.create;
export const update = taskApi.update;
export const remove = taskApi.remove;
export default taskApi;
