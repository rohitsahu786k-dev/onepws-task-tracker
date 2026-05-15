import api from './axiosInstance';

const endpoint = '/mom';

export const mOMApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = mOMApi.list;
export const getById = mOMApi.get;
export const create = mOMApi.create;
export const update = mOMApi.update;
export const remove = mOMApi.remove;
export default mOMApi;
