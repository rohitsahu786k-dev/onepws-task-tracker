import api from './axiosInstance';

const endpoint = '/calendar';

export const calendarApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = calendarApi.list;
export const getById = calendarApi.get;
export const create = calendarApi.create;
export const update = calendarApi.update;
export const remove = calendarApi.remove;
export default calendarApi;
