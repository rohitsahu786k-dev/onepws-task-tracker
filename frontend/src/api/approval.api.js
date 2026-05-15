import api from './axiosInstance';

const endpoint = '/approval';

export const approvalApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = approvalApi.list;
export const getById = approvalApi.get;
export const create = approvalApi.create;
export const update = approvalApi.update;
export const remove = approvalApi.remove;
export default approvalApi;
