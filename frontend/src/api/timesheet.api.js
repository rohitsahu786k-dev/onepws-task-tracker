import api from './axiosInstance';

const endpoint = '/timesheet';

export const timesheetApi = {
  list: (params) => api.get(endpoint, { params }).then((res) => res.data),
  get: (id, params) => api.get(`${endpoint}/${id}`, { params }).then((res) => res.data),
  create: (payload) => api.post(endpoint, payload).then((res) => res.data),
  update: (id, payload) => api.put(`${endpoint}/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`${endpoint}/${id}`).then((res) => res.data),
};

export const getAll = timesheetApi.list;
export const getById = timesheetApi.get;
export const create = timesheetApi.create;
export const update = timesheetApi.update;
export const remove = timesheetApi.remove;
export default timesheetApi;
