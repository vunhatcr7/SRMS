import { Router } from 'express';
import { applyJob, getRecruiterApplications } from '../controllers/application.controller';
import { requireAuth} from '../middlewares/auth.middleware';

const router = Router();

// Bắt buộc phải đăng nhập mới được nộp đơn
router.post('/apply', requireAuth, applyJob);
router.get('/recruiter', requireAuth, getRecruiterApplications);
export default router;