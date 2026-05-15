import api from './axiosInstance';

const endpoint = '/sla';

export const sLAApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = sLAApi.list;
export const getById = sLAApi.get;
export const create = sLAApi.create;
export const update = sLAApi.update;
export const remove = sLAApi.remove;
export default sLAApi;
