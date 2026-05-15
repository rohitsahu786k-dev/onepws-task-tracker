import api from '../lib/axios';

export const getMeetings = async (workspaceId, params = {}) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/meetings`, { params });
  return data;
};

export const getMeeting = async (workspaceId, meetingId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/meetings/${meetingId}`);
  return data;
};

export const createMeeting = async (workspaceId, payload) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/meetings`, payload);
  return data;
};

export const updateMeeting = async (workspaceId, meetingId, payload) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/meetings/${meetingId}`, payload);
  return data;
};

export const cancelMeeting = async (workspaceId, meetingId, reason) => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/meetings/${meetingId}/cancel`, { reason });
  return data;
};

export const completeMeeting = async (workspaceId, meetingId) => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/meetings/${meetingId}/complete`);
  return data;
};

export const createMOMFromMeeting = async (workspaceId, meetingId) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/meetings/${meetingId}/create-mom`);
  return data;
};

export const checkMeetingConflict = async (workspaceId, payload) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/meetings/check-conflict`, payload);
  return data;
};

export const sendMeetingInvite = async (workspaceId, meetingId) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/meetings/${meetingId}/send-invite`);
  return data;
};

export const getMeetingReport = async (workspaceId, params = {}) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/meetings/report`, { params });
  return data;
};

export const suggestKickoffDate = async (workspaceId, params = {}) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/meetings/kickoff/suggest-date`, { params });
  return data;
};
