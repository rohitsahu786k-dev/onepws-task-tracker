import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import * as authService from '../../services/auth.service';

const GoogleCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    if (accessToken) localStorage.setItem('access_token', accessToken);
    authService.getProfile()
      .then((res) => setAuth(res.data?.user || res.user, { accessToken }))
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login?error=google_auth_failed', { replace: true }));
  }, [navigate, params, setAuth]);

  return <div className="min-h-48 flex items-center justify-center text-sm text-slate-600">Signing you in...</div>;
};

export default GoogleCallback;
