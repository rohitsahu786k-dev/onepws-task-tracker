import api from '../lib/axios';

export const getMediaFiles = async (workspaceId, filters = {}) => {
  const params = new URLSearchParams(filters);
  const { data } = await api.get(`/workspaces/${workspaceId}/media?${params.toString()}`);
  return data;
};

export const uploadMedia = async (workspaceId, fileList, onUploadProgress) => {
  const formData = new FormData();
  Array.from(fileList).forEach(file => {
    formData.append('files', file);
  });
  
  const { data } = await api.post(`/workspaces/${workspaceId}/media/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });
  return data;
};

export const deleteMedia = async (workspaceId, fileId) => {
  const { data } = await api.delete(`/workspaces/${workspaceId}/media/${fileId}`);
  return data;
};

export const getPreviewUrl = (workspaceId, fileId) => {
  return `${api.defaults.baseURL}/workspaces/${workspaceId}/media/${fileId}/preview`;
};

export const getDownloadUrl = (workspaceId, fileId) => {
  return `${api.defaults.baseURL}/workspaces/${workspaceId}/media/${fileId}/download`;
};
