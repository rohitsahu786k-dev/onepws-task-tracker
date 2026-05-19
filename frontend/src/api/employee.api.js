import api from './axiosInstance';

const base = (workspaceId) => `/workspaces/${workspaceId}/employees`;

export const employeeApi = {
  list: (workspaceId, params) => api.get(base(workspaceId), { params }).then((res) => res.data),
  create: (workspaceId, payload) => api.post(base(workspaceId), payload).then((res) => res.data),
  me: (workspaceId) => api.get(`${base(workspaceId)}/me`).then((res) => res.data),
  updateMe: (workspaceId, payload) => api.put(`${base(workspaceId)}/me`, payload).then((res) => res.data),
  availability: (workspaceId, payload) => api.patch(`${base(workspaceId)}/me/availability`, payload).then((res) => res.data),
  get: (workspaceId, id) => api.get(`${base(workspaceId)}/${id}`).then((res) => res.data),
  update: (workspaceId, id, payload) => api.put(`${base(workspaceId)}/${id}`, payload).then((res) => res.data),
  remove: (workspaceId, id) => api.delete(`${base(workspaceId)}/${id}`).then((res) => res.data),
  deactivate: (workspaceId, id, payload) => api.patch(`${base(workspaceId)}/${id}/deactivate`, payload).then((res) => res.data),
  reactivate: (workspaceId, id) => api.patch(`${base(workspaceId)}/${id}/reactivate`).then((res) => res.data),
  workload: (workspaceId, id) => api.get(`${base(workspaceId)}/${id}/workload`).then((res) => res.data),
  tasks: (workspaceId, id) => api.get(`${base(workspaceId)}/${id}/tasks`).then((res) => res.data),
  projects: (workspaceId, id) => api.get(`${base(workspaceId)}/${id}/projects`).then((res) => res.data),
  documents: (workspaceId, id) => api.get(`${base(workspaceId)}/${id}/documents`).then((res) => res.data),
  addDocument: (workspaceId, id, payload) => api.post(`${base(workspaceId)}/${id}/documents`, payload).then((res) => res.data),
  addSkill: (workspaceId, id, payload) => api.post(`${base(workspaceId)}/${id}/skills`, payload).then((res) => res.data),
  orgChart: (workspaceId) => api.get(`${base(workspaceId)}/org-chart`).then((res) => res.data),
  reports: (workspaceId) => api.get(`${base(workspaceId)}/reports`).then((res) => res.data),
  skills: (workspaceId) => api.get(`${base(workspaceId)}/skills`).then((res) => res.data),
};

export default employeeApi;
