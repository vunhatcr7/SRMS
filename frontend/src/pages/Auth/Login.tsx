import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import AuthLayout from '../../components/Layouts/AuthLayout';

interface UserInfo {
  id: string;
  email: string;
  role: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<UserInfo | null>(null);
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
      setUser(userData);
      setMessage(resMessage);
      setTimeout(() => navigate(userData.role === 'CANDIDATE' ? '/candidate/ai' : '/dashboard/recruiter'), 400);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage(err.response?.data?.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Recruitment management"
      title="Đăng nhập SRMS"
      description="Quản lý tuyển dụng và tìm kiếm cơ hội phù hợp."
    >
        {!user ? (
          <form onSubmit={handleLogin}>
            <div className="form-field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="recruiter@fpt.com" />
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Mật khẩu</label>
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Nhập mật khẩu" />
            </div>

            <button type="submit" disabled={loading} className="primary-button">
              {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
            </button>
          </form>
        ) : (
          <div className="auth-success">
            <h2>Đăng nhập thành công</h2>
            <div className="auth-details">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Vai trò:</strong> <span>{user.role}</span></p>
            </div>
            <button onClick={() => { localStorage.clear(); setUser(null); navigate('/login'); }} className="secondary-button">ĐĂNG XUẤT</button>
          </div>
        )}

        {!user && (
          <p className="auth-footer">
            Chưa có tài khoản? <button type="button" onClick={() => navigate('/register')}>Đăng ký ngay</button>
          </p>
        )}

        {message && (
          <div className={`form-message ${message.includes('thành công') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
    </AuthLayout>
  );
}