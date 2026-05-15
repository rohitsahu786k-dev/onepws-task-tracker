import api from './axiosInstance';

const endpoint = '/feedback';

export const feedbackApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = feedbackApi.list;
export const getById = feedbackApi.get;
export const create = feedbackApi.create;
export const update = feedbackApi.update;
export const remove = feedbackApi.remove;
export default feedbackApi;
