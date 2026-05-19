import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as authService from '../../services/auth.service';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', designation: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await authService.register(form);
      setMessage(res.message || 'Registration successful. Please verify your email.');
      toast.success('Registration successful');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      setMessage(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 bg-white dark:bg-slate-950 p-8 rounded-xl shadow-sm border dark:border-slate-800">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Create account</h2>
      </div>
      {message && <div className="rounded-md bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-700 dark:text-slate-200">{message}</div>}
      {['name', 'email', 'phone', 'designation'].map((field) => (
        <input
          key={field}
          type={field === 'email' ? 'email' : 'text'}
          value={form[field]}
          onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
          placeholder={field[0].toUpperCase() + field.slice(1)}
          className="w-full px-4 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          required={field === 'name' || field === 'email'}
        />
      ))}
      <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} className="w-full px-4 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white" required />
      <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="w-full px-4 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 dark:text-white" required />
      <button disabled={loading} className="w-full py-2.5 rounded-md bg-primary text-white disabled:opacity-70">{loading ? 'Creating...' : 'Create account'}</button>
      <Link to="/login" className="block text-center text-sm text-primary">Back to login</Link>
    </form>
  );
};

export default Register;
