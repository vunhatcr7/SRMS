import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔥 Tự động lấy Token từ LocalStorage đút vào Header trước khi gửi request đi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('srms_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;