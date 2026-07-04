import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Lấy thống kê dashboard theo vai trò
 *     security:
 *       - BearerAuth: []
 */
router.get('/', requireAuth, getDashboardSummary);

export default router;
