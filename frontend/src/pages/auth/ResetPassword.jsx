import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as authService from '../../services/auth.service';

const ResetPassword = () => {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      const res = await authService.resetPassword(token, form);
      setMessage(res.message);
      toast.success('Password reset');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Password reset failed');
      toast.error('Password reset failed');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 bg-white dark:bg-slate-950 p-8 rounded-xl shadow-sm border dark:border-slate-800">
      <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">Reset password</h2>
      {message && <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3 text-sm">{message}</div>}
      <input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="New password" className="w-full px-4 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white" required />
      <input type="password" value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Confirm password" className="w-full px-4 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white" required />
      <button className="w-full py-2.5 rounded-md bg-primary text-white">Reset password</button>
      <Link to="/login" className="block text-center text-sm text-primary">Back to login</Link>
    </form>
  );
};

export default ResetPassword;
