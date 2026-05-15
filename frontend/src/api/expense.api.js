import api from './axiosInstance';

const endpoint = '/expense';

export const expenseApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = expenseApi.list;
export const getById = expenseApi.get;
export const create = expenseApi.create;
export const update = expenseApi.update;
export const remove = expenseApi.remove;
export default expenseApi;
