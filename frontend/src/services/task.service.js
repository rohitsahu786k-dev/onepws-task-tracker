import api from '../lib/axios';

export const getTasks = async (workspaceId, filters = {}) => {
  const params = new URLSearchParams(filters);
  const { data } = await api.get(`/workspaces/${workspaceId}/tasks?${params.toString()}`);
  return data;
};

export const createTask = async (workspaceId, payload) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/tasks`, payload);
  return data;
};

export const updateTask = async (workspaceId, taskId, payload) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/tasks/${taskId}`, payload);
  return data;
};

export const updateTaskStatus = async (workspaceId, taskId, status) => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/tasks/${taskId}/status`, { status });
  return data;
};

export const getTaskDetails = async (workspaceId, taskId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/tasks/${taskId}`);
  return data;
};
