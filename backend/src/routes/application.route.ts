import { Router } from 'express';
import { applyJob, getRecruiterApplications, updateApplicationStage } from '../controllers/application.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/application/apply:
 *   post:
 *     tags:
 *       - Application
 *     summary: Ứng viên nộp đơn ứng tuyển
 *     description: |
 *       Ứng viên nộp đơn ứng tuyển cho một tin tuyển dụng.
 *       Nếu ứng viên chưa có hồ sơ cá nhân (CandidateProfile), hệ thống tự động tạo mới.
 *       Một ứng viên chỉ nộp được 1 đơn cho mỗi tin tuyển dụng.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - resumeUrl
 *             properties:
 *               jobId:
 *                 type: string
 *                 example: "abc123def456"
 *               resumeUrl:
 *                 type: string
 *                 example: "https://example.com/resume.pdf"
 *               coverLetter:
 *                 type: string
 *                 example: "Tôi rất hứng thú với vị trí này..."
 *     responses:
 *       201:
 *         description: Nộp đơn ứng tuyển thành công!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 application:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     jobId:
 *                       type: string
 *                     candidateId:
 *                       type: string
 *                     stage:
 *                       type: string
 *                       enum: ["APPLIED", "REVIEWING", "INTERVIEW", "OFFERED", "REJECTED"]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Ứng viên đã nộp đơn cho công việc này rồi
 *       401:
 *         description: Không có token hoặc token không hợp lệ
 *       404:
 *         description: Công việc không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post('/apply', requireAuth, applyJob);

/**
 * @swagger
 * /api/v1/application/recruiter:
 *   get:
 *     tags:
 *       - Application
 *     summary: Nhà tuyển dụng xem danh sách đơn ứng tuyển
 *     description: |
 *       Lấy danh sách tất cả đơn ứng tuyển nộp vào các tin tuyển dụng của nhà tuyển dụng này.
 *       Danh sách bao gồm thông tin ứng viên, tin tuyển dụng, và trạng thái xử lý.
 *       Danh sách được sắp xếp theo đơn mới nộp lên đầu.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đơn ứng tuyển
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   jobId:
 *                     type: string
 *                   stage:
 *                     type: string
 *                     enum: ["APPLIED", "REVIEWING", "INTERVIEW", "OFFERED", "REJECTED"]
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   job:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       location:
 *                         type: string
 *                   candidateProfile:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           fullName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           avatar:
 *                             type: string
 *       401:
 *         description: Không có token hoặc token không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.get('/recruiter', requireAuth, getRecruiterApplications);

/**
 * @swagger
 * /api/v1/application/update-stage:
 *   put:
 *     tags:
 *       - Application
 *     summary: Cập nhật trạng thái xử lý đơn ứng tuyển
 *     description: |
 *       Nhà tuyển dụng cập nhật trạng thái xử lý của một đơn ứng tuyển.
 *       Chỉ nhà tuyển dụng của tin tuyển dụng mới có thể cập nhật trạng thái.
 *       Các trạng thái có thể: APPLIED, REVIEWING, INTERVIEW, OFFERED, REJECTED
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
 *               - stage
 *             properties:
 *               applicationId:
 *                 type: string
 *                 example: "app123def456"
 *               stage:
 *                 type: string
 *                 enum: ["APPLIED", "REVIEWING", "INTERVIEW", "OFFERED", "REJECTED"]
 *                 example: "INTERVIEW"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 application:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     stage:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Không có token hoặc token không hợp lệ
 *       403:
 *         description: Bạn không có quyền cập nhật đơn này
 *       404:
 *         description: Đơn ứng tuyển không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.put('/update-stage', requireAuth, updateApplicationStage);

export default router;