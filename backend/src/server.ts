import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import authRoutes from '../src/routes/auth.route';
import jobRoutes from '../src/routes/job.route';
import applicationRoutes from '../src/routes/application.route';
import candidateRoutes from '../src/routes/candidate.route';
import interviewRoutes from '../src/routes/interview.route';
import dashboardRoutes from '../src/routes/dashboard.route';
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


// =========================================================================
// ✨ CHÈN CẤU HÌNH SWAGGER ĐỂ VIẾT DOCS TẠI ĐÂY
// =========================================================================
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SRMS API Documentation',
      version: '1.0.0',
      description: 'Tài liệu API hệ thống Quản lý Tuyển dụng thông minh SRMS',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Môi trường Local (Máy tính của bạn)',
      },
      {
        url: 'https://srms-backend-staging.onrender.com', // Cập nhật link web thật của bạn sau khi deploy
        description: 'Môi trường Staging (Web thật)',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token từ endpoint login. Gửi token bằng cách thêm vào header: Authorization: Bearer YOUR_TOKEN_HERE'
        }
      }
    }
  },
  // Quét tất cả các file .route.ts hoặc .ts nằm trong thư mục src/routes để bốc dữ liệu Docs
  apis: ['./src/routes/*.ts', './routes/*.ts'], 
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Định nghĩa cổng hiển thị giao diện API Docs công khai
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// =========================================================================


// 2. Định nghĩa các Router tính năng
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/job', jobRoutes);
app.use('/api/v1/application', applicationRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/interview', interviewRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
// Tuyến đường kiểm tra nhanh hệ thống
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📑 Giao diện API Docs hiển thị tại: http://localhost:${PORT}/api/v1/docs`);
});