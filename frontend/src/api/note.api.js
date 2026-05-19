import api from './axiosInstance';

const base = (workspaceId) => `/workspaces/${workspaceId}`;

export const noteApi = {
  list: (workspaceId, params) => api.get(`${base(workspaceId)}/notes`, { params }).then((res) => res.data),
  my: (workspaceId, params) => api.get(`${base(workspaceId)}/notes/my`, { params }).then((res) => res.data),
  shared: (workspaceId, params) => api.get(`${base(workspaceId)}/notes/shared-with-me`, { params }).then((res) => res.data),
  get: (workspaceId, id, params) => api.get(`${base(workspaceId)}/notes/${id}`, { params }).then((res) => res.data),
  create: (workspaceId, payload) => api.post(`${base(workspaceId)}/notes`, payload).then((res) => res.data),
  update: (workspaceId, id, payload) => api.put(`${base(workspaceId)}/notes/${id}`, payload).then((res) => res.data),
  autosave: (workspaceId, id, payload) => api.patch(`${base(workspaceId)}/notes/${id}/autosave`, payload).then((res) => res.data),
  remove: (workspaceId, id) => api.delete(`${base(workspaceId)}/notes/${id}`).then((res) => res.data),
  share: (workspaceId, id, payload) => api.post(`${base(workspaceId)}/notes/${id}/share`, payload).then((res) => res.data),
  versions: (workspaceId, id) => api.get(`${base(workspaceId)}/notes/${id}/versions`).then((res) => res.data),
  restoreVersion: (workspaceId, id, versionId) => api.post(`${base(workspaceId)}/notes/${id}/versions/${versionId}/restore`).then((res) => res.data),
  folders: (workspaceId, params) => api.get(`${base(workspaceId)}/note-folders`, { params }).then((res) => res.data),
  createFolder: (workspaceId, payload) => api.post(`${base(workspaceId)}/note-folders`, payload).then((res) => res.data),
};

export const getAll = noteApi.list;
export const getById = noteApi.get;
export const create = noteApi.create;
export const update = noteApi.update;
export const remove = noteApi.remove;
export default noteApi;
