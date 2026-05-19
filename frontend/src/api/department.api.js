import api from './axiosInstance';

const endpoint = '/workspaces';

export const departmentApi = {
  list: (workspaceId, params) => api.get(`${endpoint}/${workspaceId}/departments`, { params }).then((res) => res.data),
  get: (workspaceId, id, params) => api.get(`${endpoint}/${workspaceId}/departments/${id}`, { params }).then((res) => res.data),
  create: (workspaceId, payload) => api.post(`${endpoint}/${workspaceId}/departments`, payload).then((res) => res.data),
  update: (workspaceId, id, payload) => api.put(`${endpoint}/${workspaceId}/departments/${id}`, payload).then((res) => res.data),
  remove: (workspaceId, id) => api.delete(`${endpoint}/${workspaceId}/departments/${id}`).then((res) => res.data),
};

export const getAll = departmentApi.list;
export const getById = departmentApi.get;
export const create = departmentApi.create;
export const update = departmentApi.update;
export const remove = departmentApi.remove;
export default departmentApi;
