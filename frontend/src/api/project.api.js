import api from './axiosInstance';

const endpoint = '/project';

export const projectApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = projectApi.list;
export const getById = projectApi.get;
export const create = projectApi.create;
export const update = projectApi.update;
export const remove = projectApi.remove;
export default projectApi;
