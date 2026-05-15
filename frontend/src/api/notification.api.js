import api from './axiosInstance';

const endpoint = '/notification';

export const notificationApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = notificationApi.list;
export const getById = notificationApi.get;
export const create = notificationApi.create;
export const update = notificationApi.update;
export const remove = notificationApi.remove;
export default notificationApi;
