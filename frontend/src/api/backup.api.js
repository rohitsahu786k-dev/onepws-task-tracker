import api from './axiosInstance';

const endpoint = '/backup';

export const backupApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = backupApi.list;
export const getById = backupApi.get;
export const create = backupApi.create;
export const update = backupApi.update;
export const remove = backupApi.remove;
export default backupApi;
