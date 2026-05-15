import api from './axiosInstance';

const endpoint = '/activity-log';

export const activityLogApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = activityLogApi.list;
export const getById = activityLogApi.get;
export const create = activityLogApi.create;
export const update = activityLogApi.update;
export const remove = activityLogApi.remove;
export default activityLogApi;
