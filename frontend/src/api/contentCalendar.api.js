import api from './axiosInstance';

const endpoint = '/content-calendar';

export const contentCalendarApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = contentCalendarApi.list;
export const getById = contentCalendarApi.get;
export const create = contentCalendarApi.create;
export const update = contentCalendarApi.update;
export const remove = contentCalendarApi.remove;
export default contentCalendarApi;
