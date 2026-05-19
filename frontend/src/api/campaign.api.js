import api from './axiosInstance';
import useAuthStore from '../store/authStore';

const workspacePath = () => {
  const workspace = useAuthStore.getState().workspace;
  const workspaceId = workspace?._id || workspace?.id || workspace;
  return workspaceId ? `/workspaces/${workspaceId}/campaigns` : '/campaigns';
};

export const campaignApi = {
  list: (params) => api.get(workspacePath(), { params }).then((res) => res.data),
  get: (id, params) => api.get(`${workspacePath()}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(workspacePath(), payload).then((res) => res.data),
  update: (id, payload) => api.put(`${workspacePath()}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${workspacePath()}/${id}`).then((res) => res.data),
  dashboard: (params) => api.get(`${workspacePath()}/dashboard`, { params }).then((res) => res.data),
  reports: (params) => api.get(`${workspacePath()}/reports`, { params }).then((res) => res.data),
};

export const getAll = campaignApi.list;
export const getById = campaignApi.get;
export const create = campaignApi.create;
export const update = campaignApi.update;
export const remove = campaignApi.remove;
export default campaignApi;
