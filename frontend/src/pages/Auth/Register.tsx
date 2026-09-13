import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import AuthLayout from '../../components/Layouts/AuthLayout';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CANDIDATE');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/auth/register', { email, password, role });
      setMessage(response.data.message || 'Account created successfully.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      description="Join the SRMS recruitment workspace."
    >
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label htmlFor="register-email" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            autoComplete="email"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="At least 6 characters"
            autoComplete="new-password"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="register-role" className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
            Role
          </label>
          <select
            id="register-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100"
          >
            <option value="CANDIDATE">Candidate</option>
            <option value="RECRUITER">Recruiter</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <button type="button" onClick={() => navigate('/login')} className="font-semibold text-brand hover:text-brand-light">
          Sign in
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
