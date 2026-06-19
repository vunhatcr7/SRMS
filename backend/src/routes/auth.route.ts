import { Router } from 'express'; // 🔥 BẮT BUỘC IMPORT TỪ EXPRESS
import { register, login } from '../controllers/auth.controller';

const router = Router();

// Định nghĩa API Đăng ký tài khoản
router.post('/register', register);
router.post('/login', login);
export default router;