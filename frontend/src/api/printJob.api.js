import api from './axiosInstance';
import useAuthStore from '../store/authStore';

const workspacePath = () => {
  const workspace = useAuthStore.getState().workspace;
  const workspaceId = workspace?._id || workspace?.id || workspace;
  return workspaceId ? `/workspaces/${workspaceId}/print-jobs` : '/print-jobs';
};

export const printJobApi = {
  list: (params) => api.get(workspacePath(), { params }).then((res) => res.data),
  get: (id) => api.get(`${workspacePath()}/${id}`).then((res) => res.data),
  create: (payload) => api.post(workspacePath(), payload).then((res) => res.data),
  update: (id, payload) => api.put(`${workspacePath()}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${workspacePath()}/${id}`).then((res) => res.data),
  dashboard: (params) => api.get(`${workspacePath()}/dashboard`, { params }).then((res) => res.data),
  addQuotation: (id, payload) => api.post(`${workspacePath()}/${id}/quotations`, payload).then((res) => res.data),
  addProof: (id, payload) => api.post(`${workspacePath()}/${id}/proofs`, payload).then((res) => res.data),
  addDispatch: (id, payload) => api.post(`${workspacePath()}/${id}/dispatches`, payload).then((res) => res.data),
  qualityCheck: (id, payload) => api.post(`${workspacePath()}/${id}/quality-check`, payload).then((res) => res.data)
};

export default printJobApi;
