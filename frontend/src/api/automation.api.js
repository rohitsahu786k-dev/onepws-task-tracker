import api from '../lib/axios';

export const getAutomationLogs = async (workspaceId, params = {}) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/automation/logs`, { params });
  return data;
};

export const getAutomationSettings = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/automation/settings`);
  return data;
};

export const updateAutomationSettings = async (workspaceId, payload) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/automation/settings`, payload);
  return data;
};

export const getAutomationJobs = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/automation/jobs`);
  return data;
};

export const runAutomationJob = async (workspaceId, jobName) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/automation/run/${jobName}`);
  return data;
};
