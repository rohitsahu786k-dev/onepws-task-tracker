import api from './axiosInstance';

const endpoint = '/milestone';

export const milestoneApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = milestoneApi.list;
export const getById = milestoneApi.get;
export const create = milestoneApi.create;
export const update = milestoneApi.update;
export const remove = milestoneApi.remove;
export default milestoneApi;
