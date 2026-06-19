import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // 🔥 CHỐT CHẶN BẢO VỆ: Nếu req.body rỗng, trả về lỗi 400 ngay lập tức thay vì làm sập server
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ 
        message: 'Server không tiếp nhận được dữ liệu (Body rỗng). Vui lòng cấu hình lại Postman!' 
      });
      return;
    }

    const { email, password } = req.body;
    const role = req.body.role as User['role']; // 🔥 Ép kiểu role từ req.body

    if (!email || !password || !role) {
       res.status(400).json({ message: 'Vui lòng nhập đầy đủ email, password và role' });
       return;
    }

    // --- Các logic giữ nguyên từ bước trước ---
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
       res.status(400).json({ message: 'Email này đã được sử dụng' });
       return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: { email, passwordHash, role },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json({ message: 'Đăng ký tài khoản thành công!', user: newUser });

  } catch (error: any) {
    console.error('Lỗi Register API:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra từ phía Server', error: error.message });
  }
};
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Chốt chặn bảo vệ: Kiểm tra body rỗng
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ message: 'Dữ liệu gửi lên không hợp lệ (Body rỗng)' });
      return;
    }

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu' });
      return;
    }

    // 2. Tìm người dùng trong Database qua Email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
      return;
    }

    // 3. So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong DB
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
      return;
    }

    // 4. Tạo mã JWT Token bảo mật (Hạn dùng 1 ngày)
    const secretKey = process.env.JWT_SECRET || 'srms_platform_secret_fallback_key';
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secretKey,
      { expiresIn: '1d' }
    );

    // 5. Trả về token và thông tin cơ bản cho Frontend
    res.status(200).json({
      message: 'Đăng nhập thành công! 🚀',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Lỗi Login API:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra từ phía Server', error: error.message });
  }
};