import { Router } from 'express';
import { applyJob } from '../controllers/application.controller';
import { requireAuth} from '../middlewares/auth.middleware';

const router = Router();

// Bắt buộc phải đăng nhập mới được nộp đơn
router.post('/apply', requireAuth, applyJob);

export default router;