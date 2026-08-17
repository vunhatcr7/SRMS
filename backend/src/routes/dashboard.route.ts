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
 *     summary: Get dashboard summary by current user role
 *     description: CANDIDATE sees own application metrics. RECRUITER sees owned job/application metrics. ADMIN and MANAGER see overall metrics.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                   example: "RECRUITER"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalJobs:
 *                       type: number
 *                     activeJobs:
 *                       type: number
 *                     totalApplications:
 *                       type: number
 *                     pendingApplications:
 *                       type: number
 *                     scheduledInterviews:
 *                       type: number
 *                     hiredCount:
 *                       type: number
 *                     applicationsByStage:
 *                       type: object
 *                 recentApplications:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Missing or invalid token
 *       500:
 *         description: Server error
 */
router.get('/', requireAuth, getDashboardSummary);

export default router;
