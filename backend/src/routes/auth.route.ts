import { Router } from 'express'; // 🔥 BẮT BUỘC IMPORT TỪ EXPRESS
import { register, login } from '../controllers/auth.controller';
import { requireAuth, rolesAllowed } from '../middlewares/auth.middleware';
const router = Router();

// Định nghĩa API Đăng ký tài khoản
router.post('/register', register);
router.post('/login', login);
router.get('/admin-only', requireAuth, rolesAllowed('ADMIN'), (req, res) => {
  res.status(200).json({
    message: 'Chào sếp bự! Sếp đã vào được khu vực bảo mật tối cao của ADMIN 👑',
    adminInfo: req.user
  });
});
export default router;