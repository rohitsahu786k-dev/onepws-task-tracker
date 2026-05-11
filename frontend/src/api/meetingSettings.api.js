import api from '../lib/axios';

export const getZoomSettings = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/settings/zoom`);
  return data;
};

export const updateZoomSettings = async (workspaceId, payload) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/settings/zoom`, payload);
  return data;
};

export const testZoomSettings = async (workspaceId) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/settings/zoom/test`);
  return data;
};

export const getGoogleMeetSettings = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/settings/google-meet`);
  return data;
};

export const updateGoogleMeetSettings = async (workspaceId, payload) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/settings/google-meet`, payload);
  return data;
};

export const testGoogleMeetSettings = async (workspaceId) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/settings/google-meet/test`);
  return data;
};
