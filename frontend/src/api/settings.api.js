import api from './axiosInstance';

const base = (workspaceId) => `/workspaces/${workspaceId}/settings`;

export const settingsApi = {
  list: (workspaceId, params) => api.get(base(workspaceId), { params }).then((res) => res.data),
  get: (workspaceId, category, params) => api.get(`${base(workspaceId)}/${category}`, { params }).then((res) => res.data),
  update: (workspaceId, category, payload) => api.put(`${base(workspaceId)}/${category}`, payload).then((res) => res.data),
  activity: (workspaceId, params) => api.get(`${base(workspaceId)}/activity`, { params }).then((res) => res.data),
  testEmail: (workspaceId, payload) => api.post(`${base(workspaceId)}/email/test`, payload).then((res) => res.data),
  testSlack: (workspaceId, payload) => api.post(`${base(workspaceId)}/slack/test`, payload).then((res) => res.data),
  testTelegram: (workspaceId, payload) => api.post(`${base(workspaceId)}/telegram/test`, payload).then((res) => res.data),
};

export const getAll = settingsApi.list;
export const getById = settingsApi.get;
export const create = settingsApi.create;
export const update = settingsApi.update;
export const remove = settingsApi.remove;
export default settingsApi;
