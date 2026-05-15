import api from './axiosInstance';

const endpoint = '/api-key';

export const apiKeyApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = apiKeyApi.list;
export const getById = apiKeyApi.get;
export const create = apiKeyApi.create;
export const update = apiKeyApi.update;
export const remove = apiKeyApi.remove;
export default apiKeyApi;
