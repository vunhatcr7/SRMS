import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { User } from '@prisma/client';

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