import { Router } from 'express';
import { createJob, getAllJobs } from '../controllers/job.controller';
import { requireAuth } from '../middlewares/auth.middleware'; // Đảm bảo bạn đã có middleware verify token này từ phần trước

const router = Router();

// Bắt buộc đăng nhập mới được tạo Job, xem danh sách thì ai cũng xem được
router.post('/create', requireAuth, createJob);
router.get('/', getAllJobs);

export default router;