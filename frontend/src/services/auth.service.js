import api from '../lib/axios';

export const login = async (email, password, rememberMe = false) => {
  const { data } = await api.post('/auth/login', { email, password, rememberMe });
  return data;
};

export const register = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch(err) {
    console.error("Logout API failed", err);
  }
};

export const forgotPassword = async (email) => (await api.post('/auth/forgot-password', { email })).data;
export const resetPassword = async (token, payload) => (await api.post(`/auth/reset-password/${token}`, payload)).data;
export const verifyEmail = async (token) => (await api.get(`/auth/verify-email/${token}`)).data;
export const resendVerification = async (email) => (await api.post('/auth/resend-verification', { email })).data;
export const loginWithTwoFactor = async (tempToken, code) => (await api.post('/auth/2fa/login', { tempToken, code })).data;
export const listSessions = async () => (await api.get('/auth/sessions')).data;
export const revokeSession = async (sessionId) => (await api.delete(`/auth/sessions/${sessionId}`)).data;
export const logoutAll = async () => (await api.post('/auth/logout-all')).data;
