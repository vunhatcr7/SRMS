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
    <div className="auth-page">
      <div className="auth-panel">
        <form onSubmit={handleRegister}>
          <p className="auth-kicker">Get started</p>
          <h2 className="auth-title">Tạo tài khoản</h2>
          <p className="auth-subtitle">Tham gia hệ thống quản lý tuyển dụng SRMS.</p>
          
          <div className="form-field">
            <label htmlFor="register-email">Email</label>
            <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@gmail.com" />
          </div>

          <div className="form-field">
            <label htmlFor="register-password">Mật khẩu</label>
            <input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Tối thiểu 6 ký tự" />
          </div>

          <div className="form-field">
            <label htmlFor="register-role">Vai trò</label>
            <select id="register-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="CANDIDATE">Ứng viên (Candidate)</option>
              <option value="RECRUITER">Nhà tuyển dụng (Recruiter)</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="primary-button">
            {loading ? 'Đang xử lý...' : 'ĐĂNG KÝ'}
          </button>
        </form>

        <p className="auth-footer">
          Đã có tài khoản? <button type="button" onClick={() => navigate('/login')}>Đăng nhập ngay</button>
        </p>

        {message && (
          <div className={`form-message ${message.includes('thành công') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}