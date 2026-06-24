import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../src/routes/auth.route';
import jobRoutes from '../src/routes/job.route';
import applicationRoutes from '../src/routes/application.route';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Cấu hình các Middleware xử lý dữ liệu đầu vào (Luôn ở trên cùng)
app.use(cors({
  origin: '*', // Sau này deploy sẽ đổi thành link Frontend thật
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Khai báo phân tích dữ liệu dạng JSON
app.use(express.urlencoded({ extended: true })); // Khai báo phân tích URL-encoded

// 2. Định nghĩa các Router tính năng
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/job', jobRoutes);
app.use('/api/v1/application', applicationRoutes);
// Tuyến đường kiểm tra nhanh hệ thống
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});