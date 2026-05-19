import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as authService from '../../services/auth.service';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message);
      toast.success('Request sent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 bg-white dark:bg-slate-950 p-8 rounded-xl shadow-sm border dark:border-slate-800">
      <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">Forgot password</h2>
      {message && <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3 text-sm">{message}</div>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white" required />
      <button disabled={loading} className="w-full py-2.5 rounded-md bg-primary text-white disabled:opacity-70">{loading ? 'Sending...' : 'Send reset link'}</button>
      <Link to="/login" className="block text-center text-sm text-primary">Back to login</Link>
    </form>
  );
};

export default ForgotPassword;
