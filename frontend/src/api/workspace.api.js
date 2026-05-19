import api from './axiosInstance';

const endpoint = '/workspaces';

export const workspaceApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
  my: () => api.get(`${endpoint}/my`).then((res) => res.data),
  permissions: (id) => api.get(`${endpoint}/${id}/me/permissions`).then((res) => res.data),
  modules: (id) => api.get(`${endpoint}/${id}/modules`).then((res) => res.data),
  updateModules: (id, payload) => api.put(`${endpoint}/${id}/modules`, payload).then((res) => res.data),
  members: (id) => api.get(`${endpoint}/${id}/members`).then((res) => res.data),
  addMember: (id, payload) => api.post(`${endpoint}/${id}/members`, payload).then((res) => res.data),
  invites: (id) => api.get(`${endpoint}/${id}/invites`).then((res) => res.data),
  invite: (id, payload) => api.post(`${endpoint}/${id}/invites`, payload).then((res) => res.data),
};

export const getAll = workspaceApi.list;
export const getById = workspaceApi.get;
export const create = workspaceApi.create;
export const update = workspaceApi.update;
export const remove = workspaceApi.remove;
export default workspaceApi;
