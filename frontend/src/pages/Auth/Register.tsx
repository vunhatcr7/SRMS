import React, { useState } from 'react';
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
      <form onSubmit={handleRegister}>
        <div className="form-field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>

        <div className="form-field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </div>

        <div className="form-field">
          <label htmlFor="register-role">Role</label>
          <select id="register-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="CANDIDATE">Candidate</option>
            <option value="RECRUITER">Recruiter</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="primary-button">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="auth-footer">
        Already have an account?{' '}
        <button type="button" onClick={() => navigate('/login')}>Sign in</button>
      </p>

      {message && (
        <div className={`form-message ${message.toLowerCase().includes('success') || message.includes('thành công') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </AuthLayout>
  );
}
