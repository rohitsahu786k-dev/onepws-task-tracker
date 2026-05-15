import api from './axiosInstance';

const endpoint = '/department';

export const departmentApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = departmentApi.list;
export const getById = departmentApi.get;
export const create = departmentApi.create;
export const update = departmentApi.update;
export const remove = departmentApi.remove;
export default departmentApi;
