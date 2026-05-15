import api from './axiosInstance';

const endpoint = '/sprint';

export const sprintApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = sprintApi.list;
export const getById = sprintApi.get;
export const create = sprintApi.create;
export const update = sprintApi.update;
export const remove = sprintApi.remove;
export default sprintApi;
