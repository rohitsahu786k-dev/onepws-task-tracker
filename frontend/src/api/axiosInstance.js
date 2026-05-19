import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const getAccessToken = () => localStorage.getItem('access_token') || localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken');

const storeTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.removeItem('accessToken');
  }
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.removeItem('refreshToken');
  }
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((item) => (error ? item.reject(error) : item.resolve(token)));
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject })).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        const { data } = await axios.post('/api/auth/refresh-token', refreshToken ? { refreshToken } : {}, { withCredentials: true });
        const accessToken = data.accessToken || data.data?.accessToken;
        const nextRefreshToken = data.refreshToken || data.data?.refreshToken;

        if (!accessToken) throw new Error('Refresh response did not include an access token.');

        storeTokens({ accessToken, refreshToken: nextRefreshToken });
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(original);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
