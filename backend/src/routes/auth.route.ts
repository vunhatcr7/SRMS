import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';
const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Đăng ký tài khoản mới
 *     description: |
 *       Tạo tài khoản mới cho ứng viên hoặc nhà tuyển dụng.
 *       Mật khẩu được mã hóa bằng bcryptjs (salted hash).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "candidate@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "Password@123"
 *               role:
 *                 type: string
 *                 enum: ["CANDIDATE", "RECRUITER", "ADMIN"]
 *                 example: "CANDIDATE"
 *     responses:
 *       201:
 *         description: Đăng ký thành công!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Lỗi validation - thiếu dữ liệu hoặc email đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Lỗi server
 */
// Định nghĩa API Đăng ký tài khoản
router.post('/register', register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Đăng nhập tài khoản
 *     description: |
 *       Xác thực email và mật khẩu, trả về JWT token có hạn dùng 1 ngày.
 *       Token dùng để authenticate các request tiếp theo (thêm vào header Authorization).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "candidate@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password@123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT token (sử dụng trong header Authorization)
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Email hoặc mật khẩu không chính xác
 *       500:
 *         description: Lỗi server
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Lấy thông tin người dùng hiện tại
 *     description: |
 *       Lấy thông tin profile của người dùng đang đăng nhập.
 *       Yêu cầu token JWT trong header Authorization.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 fullName:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 avatar:
 *                   type: string
 *       401:
 *         description: Không có token hoặc token không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.get('/me', requireAuth, getMe);

/**
 * @swagger
 * /api/v1/auth/admin-only:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Kiểm tra quyền ADMIN
 *     description: |
 *       Endpoint này chỉ dành cho ADMIN. Nếu token của bạn không phải ADMIN sẽ trả về lỗi 403.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bạn là ADMIN, đã truy cập thành công!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 adminInfo:
 *                   type: object
 *       401:
 *         description: Không có token hoặc token không hợp lệ
 *       403:
 *         description: Bạn không phải ADMIN, không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get('/admin-only', requireAuth, rolesAllowed('ADMIN'), (req, res) => {
  res.status(200).json({
    message: ' đã vào được khu vực bảo mật tối cao của ADMIN ',
    adminInfo: req.user
  });
});
export default router;