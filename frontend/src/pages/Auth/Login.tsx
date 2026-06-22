import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

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
      setUser(userData);
      setMessage(resMessage);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage(err.response?.data?.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        {!user ? (
          <form onSubmit={handleLogin}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1f2937' }}>SRMS PLATFORM LOGIN</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontSize: '14px' }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="recruiter@fpt.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontSize: '14px' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', backgroundColor: loading ? '#9ca3af' : '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#16a34a', marginBottom: '1rem' }}>🎉 Đăng nhập thành công!</h2>
            <div style={{ textAlign: 'left', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '14px' }}>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Vai trò:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{user.role}</span></p>
            </div>
            <button onClick={() => setUser(null)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>ĐĂNG XUẤT</button>
          </div>
        )}

        {!user && (
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px', color: '#4b5563' }}>
            Chưa có tài khoản? <span onClick={() => navigate('/register')} style={{ color: '#10b981', cursor: 'pointer', fontWeight: 'bold' }}>Đăng ký ngay</span>
          </p>
        )}

        {message && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '4px', textAlign: 'center', fontSize: '14px', backgroundColor: message.includes('thành công') ? '#d1fae5' : '#fee2e2', color: message.includes('thành công') ? '#065f46' : '#991b1b' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}