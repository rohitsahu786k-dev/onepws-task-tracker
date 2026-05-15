import api from './axiosInstance';

const endpoint = '/sub-task';

export const subTaskApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = subTaskApi.list;
export const getById = subTaskApi.get;
export const create = subTaskApi.create;
export const update = subTaskApi.update;
export const remove = subTaskApi.remove;
export default subTaskApi;
