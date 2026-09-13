import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import api from '../../api/axios';
import AuthLayout from '../../components/Layouts/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData, message: resMessage } = response.data;
      localStorage.setItem('srms_token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setMessage(resMessage);
      setTimeout(() => {
        const destination = userData.role === 'CANDIDATE' ? '/candidate' : userData.role === 'ADMIN' ? '/admin' : '/recruiter';
        navigate(destination);
      }, 400);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Recruitment management"
      title="Welcome back"
      description="Sign in to continue to your recruitment workspace."
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-400 dark:hover:border-navy-600"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <form onSubmit={handleLogin} className="mt-4 space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="recruiter@company.com"
            autoComplete="email"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            autoComplete="current-password"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={() => navigate('/register')} className="font-semibold text-brand hover:text-brand-light">
          Create account
        </button>
      </p>

      {message && (
        <div className={`mt-4 rounded-md border px-3 py-2.5 text-center text-xs ${
          message.toLowerCase().includes('success') || message.includes('thành công')
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'
        }`}>
          {message}
        </div>
      )}
    </AuthLayout>
  );
}
