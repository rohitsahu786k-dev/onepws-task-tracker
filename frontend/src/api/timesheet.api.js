import api from './axiosInstance';

const base = (workspaceId) => `/workspaces/${workspaceId}`;

export const timesheetApi = {
  list: (workspaceId, params) => api.get(`${base(workspaceId)}/timesheets`, { params }).then((res) => res.data),
  my: (workspaceId, params) => api.get(`${base(workspaceId)}/timesheets/my`, { params }).then((res) => res.data),
  current: (workspaceId, params) => api.get(`${base(workspaceId)}/timesheets/current`, { params }).then((res) => res.data),
  get: (workspaceId, id, params) => api.get(`${base(workspaceId)}/timesheets/${id}`, { params }).then((res) => res.data),
  create: (workspaceId, payload) => api.post(`${base(workspaceId)}/time-logs`, payload).then((res) => res.data),
  updateLog: (workspaceId, id, payload) => api.put(`${base(workspaceId)}/time-logs/${id}`, payload).then((res) => res.data),
  removeLog: (workspaceId, id) => api.delete(`${base(workspaceId)}/time-logs/${id}`).then((res) => res.data),
  submit: (workspaceId, id) => api.post(`${base(workspaceId)}/timesheets/${id}/submit`).then((res) => res.data),
  approve: (workspaceId, id, payload) => api.patch(`${base(workspaceId)}/timesheets/${id}/approve`, payload).then((res) => res.data),
  reject: (workspaceId, id, payload) => api.patch(`${base(workspaceId)}/timesheets/${id}/reject`, payload).then((res) => res.data),
  reopen: (workspaceId, id, payload) => api.patch(`${base(workspaceId)}/timesheets/${id}/reopen`, payload).then((res) => res.data),
  pendingApprovals: (workspaceId, params) => api.get(`${base(workspaceId)}/timesheets/approvals/pending`, { params }).then((res) => res.data),
  dashboard: (workspaceId, params) => api.get(`${base(workspaceId)}/timesheets/dashboard`, { params }).then((res) => res.data),
  workload: (workspaceId, params) => api.get(`${base(workspaceId)}/timesheets/workload`, { params }).then((res) => res.data),
  settings: (workspaceId) => api.get(`${base(workspaceId)}/timesheets/settings`).then((res) => res.data),
  updateSettings: (workspaceId, payload) => api.put(`${base(workspaceId)}/timesheets/settings`, payload).then((res) => res.data),
  activeTimer: (workspaceId) => api.get(`${base(workspaceId)}/timer/active`).then((res) => res.data),
  startTimer: (workspaceId, taskId) => api.post(`${base(workspaceId)}/tasks/${taskId}/timer/start`).then((res) => res.data),
  pauseTimer: (workspaceId, taskId) => api.post(`${base(workspaceId)}/tasks/${taskId}/timer/pause`).then((res) => res.data),
  resumeTimer: (workspaceId, taskId) => api.post(`${base(workspaceId)}/tasks/${taskId}/timer/resume`).then((res) => res.data),
  stopTimer: (workspaceId, taskId, payload) => api.post(`${base(workspaceId)}/tasks/${taskId}/timer/stop`, payload).then((res) => res.data),
};

export const getAll = timesheetApi.list;
export const getById = timesheetApi.get;
export const create = timesheetApi.create;
export const update = timesheetApi.updateLog;
export const remove = timesheetApi.removeLog;
export default timesheetApi;
