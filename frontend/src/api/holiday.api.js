import api from './axiosInstance';

const endpoint = '/holiday';

export const holidayApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = holidayApi.list;
export const getById = holidayApi.get;
export const create = holidayApi.create;
export const update = holidayApi.update;
export const remove = holidayApi.remove;
export default holidayApi;
