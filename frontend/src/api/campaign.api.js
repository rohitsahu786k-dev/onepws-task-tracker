import api from './axiosInstance';

const endpoint = '/campaign';

export const campaignApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = campaignApi.list;
export const getById = campaignApi.get;
export const create = campaignApi.create;
export const update = campaignApi.update;
export const remove = campaignApi.remove;
export default campaignApi;
