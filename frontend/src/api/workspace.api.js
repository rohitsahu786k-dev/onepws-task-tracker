import api from './axiosInstance';

const endpoint = '/workspace';

export const workspaceApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = workspaceApi.list;
export const getById = workspaceApi.get;
export const create = workspaceApi.create;
export const update = workspaceApi.update;
export const remove = workspaceApi.remove;
export default workspaceApi;
