import api from './axiosInstance';

const endpoint = '/budget';

export const budgetApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = budgetApi.list;
export const getById = budgetApi.get;
export const create = budgetApi.create;
export const update = budgetApi.update;
export const remove = budgetApi.remove;
export default budgetApi;
