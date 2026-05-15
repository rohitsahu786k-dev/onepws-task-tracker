import api from './axiosInstance';

const endpoint = '/media';

export const mediaApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = mediaApi.list;
export const getById = mediaApi.get;
export const create = mediaApi.create;
export const update = mediaApi.update;
export const remove = mediaApi.remove;
export default mediaApi;
