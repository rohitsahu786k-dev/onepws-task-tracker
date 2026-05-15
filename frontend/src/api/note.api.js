import api from './axiosInstance';

const endpoint = '/note';

export const noteApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = noteApi.list;
export const getById = noteApi.get;
export const create = noteApi.create;
export const update = noteApi.update;
export const remove = noteApi.remove;
export default noteApi;
