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

export const checkConflict = async (workspaceId, payload) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/calendar/check-conflict`, payload);
  return data;
};
