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
 *     summary: Tao lich phong van
 *     description: Chi ADMIN, MANAGER hoac RECRUITER so huu don ung tuyen moi co the tao lich phong van.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *               - scheduledAt
 *               - locationOrLink
 *               - interviewerName
 *             properties:
 *               applicationId:
 *                 type: string
 *                 description: Id that cua application lay tu GET /api/v1/application/recruiter
 *                 example: "paste-application-id-here"
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-15T09:00:00.000Z"
 *               locationOrLink:
 *                 type: string
 *                 example: "https://meet.google.com/demo"
 *               interviewerName:
 *                 type: string
 *                 example: "Nguyen Van A"
 *     responses:
 *       201:
 *         description: Tao lich phong van thanh cong
 *       400:
 *         description: Thieu hoac sai request body
 *       401:
 *         description: Thieu hoac sai token
 *       403:
 *         description: Khong co quyen voi don ung tuyen nay
 *       404:
 *         description: Khong tim thay don ung tuyen
 */
router.post('/', requireAuth, createInterview);

/**
 * @swagger
 * /api/v1/interview/application/{applicationId}:
 *   get:
 *     tags:
 *       - Interview
 *     summary: Xem lich phong van theo application id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Id that cua application lay tu GET /api/v1/application/recruiter
 *         example: "paste-application-id-here"
 *     responses:
 *       200:
 *         description: Danh sach lich phong van
 *       401:
 *         description: Thieu hoac sai token
 *       403:
 *         description: Khong co quyen voi don ung tuyen nay
 *       404:
 *         description: Khong tim thay don ung tuyen
 */
router.get('/application/:applicationId', requireAuth, getInterviewsByApplication);

/**
 * @swagger
 * /api/v1/interview/{id}:
 *   put:
 *     tags:
 *       - Interview
 *     summary: Cap nhat lich phong van
 *     description: Chi ADMIN, MANAGER hoac RECRUITER so huu don ung tuyen moi co the cap nhat lich phong van.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Id cua interview tra ve tu POST /api/v1/interview
 *         example: "paste-interview-id-here"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-16T10:00:00.000Z"
 *               locationOrLink:
 *                 type: string
 *                 example: "Room 301"
 *               interviewerName:
 *                 type: string
 *                 example: "Tran Thi B"
 *     responses:
 *       200:
 *         description: Cap nhat lich phong van thanh cong
 *       400:
 *         description: Request body khong hop le
 *       401:
 *         description: Thieu hoac sai token
 *       403:
 *         description: Khong co quyen voi lich phong van nay
 *       404:
 *         description: Khong tim thay lich phong van
 */
router.put('/:id', requireAuth, updateInterview);

export default router;
