import { Router } from 'express';
import { getCandidateProfileByUserId, getMyCandidateProfile, upsertMyCandidateProfile } from '../controllers/candidate.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/candidate/profile:
 *   get:
 *     tags:
 *       - Candidate
 *     summary: Xem hồ sơ ứng viên của chính mình
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Hồ sơ ứng viên
 *       404:
 *         description: Chưa có hồ sơ
 */
router.get('/profile', requireAuth, rolesAllowed('CANDIDATE'), getMyCandidateProfile);

/**
 * @swagger
 * /api/v1/candidate/profile:
 *   put:
 *     tags:
 *       - Candidate
 *     summary: Tạo hoặc cập nhật hồ sơ ứng viên
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               experience:
 *                 type: object
 *               education:
 *                 type: object
 *               resumeUrl:
 *                 type: string
 */
router.put('/profile', requireAuth, rolesAllowed('CANDIDATE'), upsertMyCandidateProfile);

/**
 * @swagger
 * /api/v1/candidate/profile/{userId}:
 *   get:
 *     tags:
 *       - Candidate
 *     summary: Xem hồ sơ ứng viên theo userId
 *     security:
 *       - BearerAuth: []
 */
router.get('/profile/:userId', requireAuth, getCandidateProfileByUserId);

export default router;
