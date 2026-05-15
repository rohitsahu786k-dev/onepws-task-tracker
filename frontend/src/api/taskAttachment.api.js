import api from './axiosInstance';

const endpoint = '/task-attachment';

export const taskAttachmentApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = taskAttachmentApi.list;
export const getById = taskAttachmentApi.get;
export const create = taskAttachmentApi.create;
export const update = taskAttachmentApi.update;
export const remove = taskAttachmentApi.remove;
export default taskAttachmentApi;
