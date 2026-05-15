import api from './axiosInstance';

const endpoint = '/intake-form';

export const intakeFormApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = intakeFormApi.list;
export const getById = intakeFormApi.get;
export const create = intakeFormApi.create;
export const update = intakeFormApi.update;
export const remove = intakeFormApi.remove;
export default intakeFormApi;
