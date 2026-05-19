import api from './axiosInstance';

const baseEndpoint = (workspaceId) => (workspaceId ? `/workspaces/${workspaceId}/wiki` : '/wiki');

export const wikiApi = {
  home: (workspaceId, params) => api.get(`${baseEndpoint(workspaceId)}/home`, { params }).then((res) => res.data),
  reports: (workspaceId, params) => api.get(`${baseEndpoint(workspaceId)}/reports`, { params }).then((res) => res.data),
  list: (workspaceId, params) => api.get(`${baseEndpoint(workspaceId)}/articles`, { params }).then((res) => res.data),
  get: (workspaceId, id, params) => api.get(`${baseEndpoint(workspaceId)}/articles/${id}`, { params }).then((res) => res.data),
  create: (workspaceId, payload) => api.post(`${baseEndpoint(workspaceId)}/articles`, payload).then((res) => res.data),
  update: (workspaceId, id, payload) => api.put(`${baseEndpoint(workspaceId)}/articles/${id}`, payload).then((res) => res.data),
  remove: (workspaceId, id) => api.delete(`${baseEndpoint(workspaceId)}/articles/${id}`).then((res) => res.data),
  submitReview: (workspaceId, id) => api.post(`${baseEndpoint(workspaceId)}/articles/${id}/submit-review`).then((res) => res.data),
  approve: (workspaceId, id, payload) => api.patch(`${baseEndpoint(workspaceId)}/articles/${id}/approve`, payload).then((res) => res.data),
  reject: (workspaceId, id, payload) => api.patch(`${baseEndpoint(workspaceId)}/articles/${id}/reject`, payload).then((res) => res.data),
  status: (workspaceId, id, action, payload = {}) => api.patch(`${baseEndpoint(workspaceId)}/articles/${id}/${action}`, payload).then((res) => res.data),
  versions: (workspaceId, id) => api.get(`${baseEndpoint(workspaceId)}/articles/${id}/versions`).then((res) => res.data),
  restoreVersion: (workspaceId, id, versionId) => api.post(`${baseEndpoint(workspaceId)}/articles/${id}/versions/${versionId}/restore`).then((res) => res.data),
  comments: (workspaceId, id) => api.get(`${baseEndpoint(workspaceId)}/articles/${id}/comments`).then((res) => res.data),
  addComment: (workspaceId, id, payload) => api.post(`${baseEndpoint(workspaceId)}/articles/${id}/comments`, payload).then((res) => res.data),
  feedback: (workspaceId, id, payload) => api.post(`${baseEndpoint(workspaceId)}/articles/${id}/feedback`, payload).then((res) => res.data),
  activity: (workspaceId, id) => api.get(`${baseEndpoint(workspaceId)}/articles/${id}/activity`).then((res) => res.data),
  categories: (workspaceId, params) => api.get(`${baseEndpoint(workspaceId)}/categories`, { params }).then((res) => res.data),
  createCategory: (workspaceId, payload) => api.post(`${baseEndpoint(workspaceId)}/categories`, payload).then((res) => res.data),
  updateCategory: (workspaceId, id, payload) => api.put(`${baseEndpoint(workspaceId)}/categories/${id}`, payload).then((res) => res.data),
  templates: (workspaceId, params) => api.get(`${baseEndpoint(workspaceId)}/templates`, { params }).then((res) => res.data),
  createTemplate: (workspaceId, payload) => api.post(`${baseEndpoint(workspaceId)}/templates`, payload).then((res) => res.data),
  updateTemplate: (workspaceId, id, payload) => api.put(`${baseEndpoint(workspaceId)}/templates/${id}`, payload).then((res) => res.data),
};

export const getAll = wikiApi.list;
export const getById = wikiApi.get;
export const create = wikiApi.create;
export const update = wikiApi.update;
export const remove = wikiApi.remove;
export default wikiApi;
