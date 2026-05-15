import api from './axiosInstance';

const endpoint = '/wiki';

export const wikiApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = wikiApi.list;
export const getById = wikiApi.get;
export const create = wikiApi.create;
export const update = wikiApi.update;
export const remove = wikiApi.remove;
export default wikiApi;
