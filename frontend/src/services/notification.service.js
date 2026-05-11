import api from '../lib/axios';

export const getNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', { params });
  return data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count');
  return data;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch('/notifications/read-all');
  return data;
};

export const archiveNotification = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/archive`);
  return data;
};

export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
};

export const getNotificationPreferences = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/notification-preferences`);
  return data;
};

export const updateNotificationPreferences = async (workspaceId, payload) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/notification-preferences`, payload);
  return data;
};

export const getEmailTemplates = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/email-templates`);
  return data;
};

export const saveEmailTemplate = async (workspaceId, template) => {
  const request = template._id
    ? api.put(`/workspaces/${workspaceId}/email-templates/${template._id}`, template)
    : api.post(`/workspaces/${workspaceId}/email-templates`, template);
  const { data } = await request;
  return data;
};

export const deleteEmailTemplate = async (workspaceId, templateId) => {
  const { data } = await api.delete(`/workspaces/${workspaceId}/email-templates/${templateId}`);
  return data;
};

export const getNotificationTemplates = async (workspaceId, params = {}) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/notification-templates`, { params });
  return data;
};

export const saveNotificationTemplate = async (workspaceId, template) => {
  const request = template._id
    ? api.put(`/workspaces/${workspaceId}/notification-templates/${template._id}`, template)
    : api.post(`/workspaces/${workspaceId}/notification-templates`, template);
  const { data } = await request;
  return data;
};

export const deleteNotificationTemplate = async (workspaceId, templateId) => {
  const { data } = await api.delete(`/workspaces/${workspaceId}/notification-templates/${templateId}`);
  return data;
};

export const testEmailSettings = async (workspaceId, payload = {}) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/settings/email/test`, payload);
  return data;
};

export const testSlackSettings = async (workspaceId, payload = {}) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/settings/slack/test`, payload);
  return data;
};

export const testTelegramSettings = async (workspaceId, payload = {}) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/settings/telegram/test`, payload);
  return data;
};
