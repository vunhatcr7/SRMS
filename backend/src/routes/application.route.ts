import { Router } from 'express';
import { applyJob, getRecruiterApplications, updateApplicationStage } from '../controllers/application.controller';
import { requireAuth} from '../middlewares/auth.middleware';

const router = Router();

// Bắt buộc phải đăng nhập mới được nộp đơn
router.post('/apply', requireAuth, applyJob);
router.get('/recruiter', requireAuth, getRecruiterApplications);
router.put('/update-stage', requireAuth, updateApplicationStage);
export default router;