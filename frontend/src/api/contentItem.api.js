import api from './axiosInstance';
import useAuthStore from '../store/authStore';

const workspacePath = () => {
  const workspace = useAuthStore.getState().workspace;
  const workspaceId = workspace?._id || workspace?.id || workspace;
  return workspaceId ? `/workspaces/${workspaceId}/content-items` : '/content-items';
};

export const contentItemApi = {
  list: (params) => api.get(workspacePath(), { params }).then((res) => res.data),
  get: (id) => api.get(`${workspacePath()}/${id}`).then((res) => res.data),
  create: (payload) => api.post(workspacePath(), payload).then((res) => res.data),
  update: (id, payload) => api.put(`${workspacePath()}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${workspacePath()}/${id}`).then((res) => res.data),
  schedule: (id, payload) => api.patch(`${workspacePath()}/${id}/schedule`, payload).then((res) => res.data),
  publish: (id, payload) => api.patch(`${workspacePath()}/${id}/publish`, payload).then((res) => res.data),
  updatePerformance: (id, payload) => api.patch(`${workspacePath()}/${id}/performance`, payload).then((res) => res.data)
};

export default contentItemApi;
