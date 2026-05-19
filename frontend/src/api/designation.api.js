import api from './axiosInstance';

const base = (workspaceId) => `/workspaces/${workspaceId}/designations`;

export const designationApi = {
  list: (workspaceId, params) => api.get(base(workspaceId), { params }).then((res) => res.data),
  create: (workspaceId, payload) => api.post(base(workspaceId), payload).then((res) => res.data),
  get: (workspaceId, id) => api.get(`${base(workspaceId)}/${id}`).then((res) => res.data),
  update: (workspaceId, id, payload) => api.put(`${base(workspaceId)}/${id}`, payload).then((res) => res.data),
  remove: (workspaceId, id) => api.delete(`${base(workspaceId)}/${id}`).then((res) => res.data),
};

export default designationApi;
