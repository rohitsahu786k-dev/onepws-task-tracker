import api from './axiosInstance';

const endpoint = '/tracker';

export const trackerApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = trackerApi.list;
export const getById = trackerApi.get;
export const create = trackerApi.create;
export const update = trackerApi.update;
export const remove = trackerApi.remove;
export default trackerApi;
