import api from './axiosInstance';

const endpoint = '/auth';

export const authApi = {
  login: (payload) => api.post(`${endpoint}/login`, payload).then((res) => res.data),
  register: (payload) => api.post(`${endpoint}/register`, payload).then((res) => res.data),
  me: () => api.get(`${endpoint}/me`).then((res) => res.data),
  logout: () => api.post(`${endpoint}/logout`).then((res) => res.data),
  forgotPassword: (payload) => api.post(`${endpoint}/forgot-password`, payload).then((res) => res.data),
  resetPassword: (token, payload) => api.post(`${endpoint}/reset-password/${token}`, payload).then((res) => res.data),
  verifyEmail: (token) => api.get(`${endpoint}/verify-email/${token}`).then((res) => res.data),
};

export const getAll = authApi.list;
export const getById = authApi.get;
export const create = authApi.create;
export const update = authApi.update;
export const remove = authApi.remove;
export default authApi;
