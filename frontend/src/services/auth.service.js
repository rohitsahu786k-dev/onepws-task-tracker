import api from '../lib/axios';

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const logout = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (refreshToken) {
    try {
      await api.post('/auth/logout', { token: refreshToken });
    } catch(err) {
      console.error("Logout API failed", err);
    }
  }
};
