import api from './axiosInstance';
import useAuthStore from '../store/authStore';

const workspacePath = () => {
  const workspace = useAuthStore.getState().workspace;
  const workspaceId = workspace?._id || workspace?.id || workspace;
  return workspaceId ? `/workspaces/${workspaceId}/dashboard` : '/dashboard';
};

export const dashboardApi = {
  get: (params) => api.get(workspacePath(), { params }).then((res) => res.data),
  layout: (params) => api.get(`${workspacePath()}/layout`, { params }).then((res) => res.data),
  saveLayout: (payload) => api.put(`${workspacePath()}/layout`, payload).then((res) => res.data),
  resetLayout: (payload) => api.post(`${workspacePath()}/layout/reset`, payload).then((res) => res.data),
  widgets: () => api.get(`${workspacePath()}/widgets`).then((res) => res.data),
  widgetData: (widgetKey, params) => api.get(`${workspacePath()}/widgets/${widgetKey}/data`, { params }).then((res) => res.data),
  summary: () => api.get(`${workspacePath()}/summary`).then((res) => res.data),
  preferences: () => api.get(`${workspacePath()}/preferences`).then((res) => res.data),
  savePreferences: (payload) => api.put(`${workspacePath()}/preferences`, payload).then((res) => res.data)
};

export default dashboardApi;
