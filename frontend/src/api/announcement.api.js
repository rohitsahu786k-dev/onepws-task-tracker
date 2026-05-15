import api from './axiosInstance';

const endpoint = '/announcement';

export const announcementApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = announcementApi.list;
export const getById = announcementApi.get;
export const create = announcementApi.create;
export const update = announcementApi.update;
export const remove = announcementApi.remove;
export default announcementApi;
