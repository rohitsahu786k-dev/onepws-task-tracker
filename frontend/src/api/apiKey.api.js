import api from './axiosInstance';

const base = (wid) => `/workspaces/${wid}/api-keys`;

export const apiKeyApi = {
  list: (wid, params) => api.get(base(wid), { params }).then((r) => r.data),
  create: (wid, payload) => api.post(base(wid), payload).then((r) => r.data),
  getById: (wid, keyId) => api.get(`${base(wid)}/${keyId}`).then((r) => r.data),
  update: (wid, keyId, payload) => api.put(`${base(wid)}/${keyId}`, payload).then((r) => r.data),
  disable: (wid, keyId) => api.patch(`${base(wid)}/${keyId}/disable`).then((r) => r.data),
  revoke: (wid, keyId, payload) => api.patch(`${base(wid)}/${keyId}/revoke`, payload).then((r) => r.data),
  remove: (wid, keyId) => api.delete(`${base(wid)}/${keyId}`).then((r) => r.data),
  getUsage: (wid, keyId, params) => api.get(`${base(wid)}/${keyId}/usage`, { params }).then((r) => r.data),
  duplicate: (wid, keyId, payload) => api.post(`${base(wid)}/${keyId}/duplicate`, payload).then((r) => r.data),
};

export const webhookApi = {
  list: (wid, params) => api.get(`/workspaces/${wid}/webhooks`, { params }).then((r) => r.data),
  create: (wid, payload) => api.post(`/workspaces/${wid}/webhooks`, payload).then((r) => r.data),
  getById: (wid, id) => api.get(`/workspaces/${wid}/webhooks/${id}`).then((r) => r.data),
  update: (wid, id, payload) => api.put(`/workspaces/${wid}/webhooks/${id}`, payload).then((r) => r.data),
  remove: (wid, id) => api.delete(`/workspaces/${wid}/webhooks/${id}`).then((r) => r.data),
  enable: (wid, id) => api.patch(`/workspaces/${wid}/webhooks/${id}/enable`).then((r) => r.data),
  disable: (wid, id) => api.patch(`/workspaces/${wid}/webhooks/${id}/disable`).then((r) => r.data),
  pause: (wid, id) => api.patch(`/workspaces/${wid}/webhooks/${id}/pause`).then((r) => r.data),
  test: (wid, id) => api.post(`/workspaces/${wid}/webhooks/${id}/test`).then((r) => r.data),
  getDeliveries: (wid, id, params) => api.get(`/workspaces/${wid}/webhooks/${id}/deliveries`, { params }).then((r) => r.data),
  getEventCatalog: (wid) => api.get(`/workspaces/${wid}/developer/event-catalog`).then((r) => r.data),
};

export const webhookDeliveryApi = {
  list: (wid, params) => api.get(`/workspaces/${wid}/webhook-deliveries`, { params }).then((r) => r.data),
  getById: (wid, id) => api.get(`/workspaces/${wid}/webhook-deliveries/${id}`).then((r) => r.data),
  retry: (wid, id) => api.post(`/workspaces/${wid}/webhook-deliveries/${id}/retry`).then((r) => r.data),
  retryFailed: (wid, payload) => api.post(`/workspaces/${wid}/webhook-deliveries/retry-failed`, payload).then((r) => r.data),
};

export const developerApi = {
  getActivity: (wid, params) => api.get(`/workspaces/${wid}/developer/activity`, { params }).then((r) => r.data),
  getEventCatalog: (wid) => api.get(`/workspaces/${wid}/developer/event-catalog`).then((r) => r.data),
};

export default apiKeyApi;
