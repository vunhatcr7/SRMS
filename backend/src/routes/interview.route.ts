import { Router } from 'express';
import { createInterview, getInterviewsByApplication, updateInterview } from '../controllers/interview.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/interview:
 *   post:
 *     tags:
 *       - Interview
 *     summary: Tạo lịch phỏng vấn
 *     security:
 *       - BearerAuth: []
 */
router.post('/', requireAuth, createInterview);

/**
 * @swagger
 * /api/v1/interview/application/{applicationId}:
 *   get:
 *     tags:
 *       - Interview
 *     summary: Xem lịch phỏng vấn theo đơn ứng tuyển
 *     security:
 *       - BearerAuth: []
 */
router.get('/application/:applicationId', requireAuth, getInterviewsByApplication);

/**
 * @swagger
 * /api/v1/interview/{id}:
 *   put:
 *     tags:
 *       - Interview
 *     summary: Cập nhật lịch phỏng vấn
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id', requireAuth, updateInterview);

export default router;
