import api from '../lib/axios';

// Tracker configuration (columns/fields)
export const getTrackerConfig = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/tracker/config`);
  return data;
};

export const updateTrackerConfig = async (workspaceId, payload) => {
  const configId = payload.configId || payload._id;
  const { data } = await api.put(`/workspaces/${workspaceId}/tracker/config/${configId}`, payload);
  return data;
};

export const addTrackerField = async (workspaceId, configId, fieldData) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/tracker/config/fields`, { configId, fieldData });
  return data;
};

export const updateTrackerField = async (workspaceId, configId, fieldId, updateData) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/tracker/config/fields/${fieldId}`, { configId, updateData });
  return data;
};

export const deleteTrackerField = async (workspaceId, configId, fieldId) => {
  const { data } = await api.delete(`/workspaces/${workspaceId}/tracker/config/fields/${fieldId}`, { data: { configId } });
  return data;
};

// Tracker rows (data)
export const getTrackerRows = async (workspaceId, filters = {}) => {
  const params = new URLSearchParams(filters);
  const { data } = await api.get(`/workspaces/${workspaceId}/tracker/rows?${params.toString()}`);
  return data;
};

export const addTrackerRow = async (workspaceId, payload) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/tracker/rows`, payload);
  return data;
};

export const updateTrackerRow = async (workspaceId, rowId, payload) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/tracker/rows/${rowId}`, payload);
  return data;
};

export const updateTrackerCell = async (workspaceId, rowId, fieldKey, value) => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/tracker/rows/${rowId}/cell`, { fieldKey, value });
  return data;
};

export const deleteTrackerRow = async (workspaceId, rowId) => {
  const { data } = await api.delete(`/workspaces/${workspaceId}/tracker/rows/${rowId}`);
  return data;
};
