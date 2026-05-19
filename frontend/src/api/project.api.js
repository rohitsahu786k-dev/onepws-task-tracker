import api from './axiosInstance';

const endpoint = '/workspaces';

export const projectApi = {
  list: (workspaceId, params) => api.get(`${endpoint}/${workspaceId}/projects`, { params }).then((res) => res.data),
  get: (workspaceId, id, params) => api.get(`${endpoint}/${workspaceId}/projects/${id}`, { params }).then((res) => res.data),
  create: (workspaceId, payload) => api.post(`${endpoint}/${workspaceId}/projects`, payload).then((res) => res.data),
  update: (workspaceId, id, payload) => api.put(`${endpoint}/${workspaceId}/projects/${id}`, payload).then((res) => res.data),
  remove: (workspaceId, id) => api.delete(`${endpoint}/${workspaceId}/projects/${id}`).then((res) => res.data),
  dashboard: (workspaceId, id) => api.get(`${endpoint}/${workspaceId}/projects/${id}/dashboard`).then((res) => res.data),
  milestones: (workspaceId, id) => api.get(`${endpoint}/${workspaceId}/projects/${id}/milestones`).then((res) => res.data),
};

export const getAll = projectApi.list;
export const getById = projectApi.get;
export const create = projectApi.create;
export const update = projectApi.update;
export const remove = projectApi.remove;
export default projectApi;
