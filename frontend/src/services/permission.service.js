import api from '../lib/axios';

export const getMyPermissions = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/me/permissions`);
  return data;
};

export const getRolePermissions = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/permissions`);
  return data;
};

export const updateRolePermissions = async (workspaceId, role, permissions) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/permissions/${role}`, { permissions });
  return data;
};

export const resetPermissions = async (workspaceId, role) => {
  const { data } = await api.post(`/workspaces/${workspaceId}/permissions/reset-default`, { role });
  return data;
};

export const getWorkspaceModules = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/modules`);
  return data;
};

export const updateWorkspaceModules = async (workspaceId, allowedModules) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/modules`, { allowedModules });
  return data;
};

export const getCustomRoles = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/custom-roles`);
  return data;
};

export const saveCustomRole = async (workspaceId, role) => {
  const request = role._id
    ? api.put(`/workspaces/${workspaceId}/custom-roles/${role._id}`, role)
    : api.post(`/workspaces/${workspaceId}/custom-roles`, role);
  const { data } = await request;
  return data;
};

export const getMembers = async (workspaceId) => {
  const { data } = await api.get(`/workspaces/${workspaceId}/members`);
  return data;
};

export const updateMemberRole = async (workspaceId, userId, payload) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/members/${userId}/role`, payload);
  return data;
};

export const updateMemberDepartment = async (workspaceId, userId, department) => {
  const { data } = await api.put(`/workspaces/${workspaceId}/members/${userId}/department`, { department });
  return data;
};
