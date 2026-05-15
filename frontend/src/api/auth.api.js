import api from './axiosInstance';

const endpoint = '/auth';

export const authApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = authApi.list;
export const getById = authApi.get;
export const create = authApi.create;
export const update = authApi.update;
export const remove = authApi.remove;
export default authApi;
