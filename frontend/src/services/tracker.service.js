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

export const submitTrackerRow = async (workspaceId, rowId) => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/tracker/rows/${rowId}/submit`);
  return data;
};

export const lockTrackerRow = async (workspaceId, rowId) => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/tracker/rows/${rowId}/lock`);
  return data;
};

export const unlockTrackerRow = async (workspaceId, rowId) => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/tracker/rows/${rowId}/unlock`);
  return data;
};

export const reorderTrackerFields = async (workspaceId, configId, reorderData) => {
  const { data } = await api.patch(`/workspaces/${workspaceId}/tracker/config/reorder`, { configId, reorderData });
  return data;
};

export const importTrackerRows = async (workspaceId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/workspaces/${workspaceId}/tracker/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getTrackerSummary = async (workspaceId, filters = {}) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/tracker/reports/summary`, { params: filters });
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

export const downloadTrackerTemplate = (workspaceId) =>
  downloadBlob(
    () => api.get(`/workspaces/${workspaceId}/tracker/template`, { responseType: 'blob' }),
    'daily-tracker-template.xlsx'
  );

export const exportTrackerExcel = (workspaceId, filters = {}) =>
  downloadBlob(
    () => api.post(`/workspaces/${workspaceId}/tracker/export/excel`, { filters }, { responseType: 'blob' }),
    'daily-tracker-export.xlsx'
  );

export const exportTrackerPdf = (workspaceId, filters = {}) =>
  downloadBlob(
    () => api.post(`/workspaces/${workspaceId}/tracker/export/pdf`, { filters }, { responseType: 'blob' }),
    'daily-tracker-summary.pdf'
  );
