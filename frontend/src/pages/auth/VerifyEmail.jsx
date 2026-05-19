import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as authService from '../../services/auth.service';

const VerifyEmail = () => {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, message: 'Verifying...' });

  useEffect(() => {
    authService.verifyEmail(token)
      .then((res) => setState({ loading: false, message: res.message || 'Email verified successfully' }))
      .catch((error) => setState({ loading: false, message: error.response?.data?.message || 'Invalid or expired verification link' }));
  }, [token]);

  return (
    <section className="space-y-5 bg-white dark:bg-slate-950 p-8 rounded-xl shadow-sm border dark:border-slate-800 text-center">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Verify email</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">{state.message}</p>
      {!state.loading && <Link to="/login" className="text-primary text-sm">Continue to login</Link>}
    </section>
  );
};

export default VerifyEmail;
