import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import AuthLayout from '../../components/Layouts/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

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
      <form onSubmit={handleLogin}>
        <div className="form-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="recruiter@company.com"
            autoComplete="email"
          />
        </div>

        <div className="form-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={loading} className="primary-button">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="auth-footer">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={() => navigate('/register')}>Create account</button>
      </p>

      {message && (
        <div className={`form-message ${message.toLowerCase().includes('success') || message.includes('thành công') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </AuthLayout>
  );
}
