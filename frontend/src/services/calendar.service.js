import api from '../lib/axios';

export const getEvents = async (workspaceId, params = {}) => {
  const query = new URLSearchParams(params);
  const { data } = await api.get(`/workspaces/${workspaceId}/calendar/events?${query.toString()}`);
  return data;
};

export const getMyEvents = async (workspaceId, params = {}) => {
  const query = new URLSearchParams(params);
  const { data } = await api.get(`/workspaces/${workspaceId}/calendar/my?${query.toString()}`);
  return data;
};

export const getTeamEvents = async (workspaceId, params = {}) => {
  const query = new URLSearchParams(params);
  const { data } = await api.get(`/workspaces/${workspaceId}/calendar/team?${query.toString()}`);
  return data;
};

export const createEvent = async (workspaceId, payload) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/calendar/events`, payload);
  return data;
};

export const updateEvent = async (workspaceId, eventId, payload) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/calendar/events/${eventId}`, payload);
  return data;
};

export const deleteEvent = async (workspaceId, eventId) => {
  const { data } = await api.delete(`/workspaces/${workspaceId}/calendar/events/${eventId}`);
  return data;
};

export const completeEvent = async (workspaceId, eventId) => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/calendar/events/${eventId}/complete`);
  return data;
};

export const cancelEvent = async (workspaceId, eventId, reason) => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/calendar/events/${eventId}/cancel`, { reason });
  return data;
};

export const addReminder = async (workspaceId, eventId, payload) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/calendar/events/${eventId}/reminders`, payload);
  return data;
};

export const removeReminder = async (workspaceId, eventId, reminderId) => {
  const { data } = await api.delete(`/workspaces/${workspaceId}/calendar/events/${eventId}/reminders/${reminderId}`);
  return data;
};

export const checkConflict = async (workspaceId, payload) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/calendar/check-conflict`, payload);
  return data;
};

export const getSummary = async (workspaceId, params = {}) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/calendar/reports/summary`, { params });
  return data;
};

const downloadBlob = async (request, fileName) => {
  const response = await request();
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
};

export const exportExcel = (workspaceId, filters = {}) =>
  downloadBlob(
    () => api.post(`/workspaces/${workspaceId}/calendar/export/excel`, { filters }, { responseType: 'blob' }),
    'calendar-events.xlsx'
  );

export const exportPdf = (workspaceId, filters = {}) =>
  downloadBlob(
    () => api.post(`/workspaces/${workspaceId}/calendar/export/pdf`, { filters }, { responseType: 'blob' }),
    'calendar-report.pdf'
  );
