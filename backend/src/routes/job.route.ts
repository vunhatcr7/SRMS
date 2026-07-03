import { Router } from 'express';
import { createJob, getAllJobs } from '../controllers/job.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/job/create:
 *   post:
 *     tags:
 *       - Job
 *     summary: Tạo tin tuyển dụng mới
 *     description: |
 *       Chỉ nhà tuyển dụng (RECRUITER) mới có thể tạo tin tuyển dụng.
 *       Nếu công ty chưa tồn tại trong hệ thống, hệ thống sẽ tự động tạo mới.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - requirements
 *               - salaryRange
 *               - location
 *               - companyName
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Senior Developer"
 *               description:
 *                 type: string
 *                 example: "Tìm kiếm lập trình viên có 5+ năm kinh nghiệm..."
 *               requirements:
 *                 type: string
 *                 example: "JavaScript, TypeScript, React, Node.js"
 *               salaryRange:
 *                 type: string
 *                 example: "15,000 - 25,000 USD"
 *               location:
 *                 type: string
 *                 example: "Hanoi, Vietnam"
 *               companyName:
 *                 type: string
 *                 example: "Tech Company ABC"
 *     responses:
 *       201:
 *         description: Tạo tin tuyển dụng thành công!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 job:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     location:
 *                       type: string
 *                     salaryRange:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Không có token hoặc token không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/create', requireAuth, createJob);

/**
 * @swagger
 * /api/v1/job:
 *   get:
 *     tags:
 *       - Job
 *     summary: Lấy danh sách tất cả tin tuyển dụng
 *     description: |
 *       Lấy danh sách các tin tuyển dụng đang hoạt động.
 *       Danh sách được sắp xếp theo tin mới nhất lên đầu.
 *       Không yêu cầu authentication.
 *     responses:
 *       200:
 *         description: Danh sách tin tuyển dụng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   requirements:
 *                     type: string
 *                   salaryRange:
 *                     type: string
 *                   location:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   company:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *       500:
 *         description: Lỗi server
 */
router.get('/', getAllJobs);

export default router;
