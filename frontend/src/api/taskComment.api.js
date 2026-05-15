import api from './axiosInstance';

const endpoint = '/task-comment';

export const taskCommentApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = taskCommentApi.list;
export const getById = taskCommentApi.get;
export const create = taskCommentApi.create;
export const update = taskCommentApi.update;
export const remove = taskCommentApi.remove;
export default taskCommentApi;
