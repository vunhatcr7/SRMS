import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CANDIDATE'); // Mặc định là ứng viên
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/auth/register', { email, password, role });
      setMessage(response.data.message || 'Đăng ký thành công!');
      // Đăng ký xong tự động chuyển sang trang đăng nhập sau 2 giây
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage(err.response?.data?.message || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <form onSubmit={handleRegister}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1f2937' }}>ĐĂNG KÝ TÀI KHOẢN</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontSize: '14px' }}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@gmail.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontSize: '14px' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#4b5563', fontSize: '14px' }}>Bạn là:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#fff' }}>
              <option value="CANDIDATE">Ứng viên (Candidate)</option>
              <option value="RECRUITER">Nhà tuyển dụng (Recruiter)</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem', backgroundColor: loading ? '#9ca3af' : '#10b981', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Đang xử lý...' : 'ĐĂNG KÝ'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px', color: '#4b5563' }}>
          Đã có tài khoản? <span onClick={() => navigate('/login')} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }}>Đăng nhập ngay</span>
        </p>

        {message && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '4px', textAlign: 'center', fontSize: '14px', backgroundColor: message.includes('thành công') ? '#d1fae5' : '#fee2e2', color: message.includes('thành công') ? '#065f46' : '#991b1b' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}