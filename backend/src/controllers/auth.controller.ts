import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import prisma from '../config/db';

const selfRegisterRoles = ['CANDIDATE', 'RECRUITER'] as const;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isSelfRegisterRole = (role: unknown): role is (typeof selfRegisterRoles)[number] => {
  return typeof role === 'string' && selfRegisterRoles.includes(role as (typeof selfRegisterRoles)[number]);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body ?? {};

    if (Object.keys(body).length === 0) {
      res.status(400).json({ message: 'Body khong duoc de trong.' });
      return;
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const requestedRole = body.role ?? 'CANDIDATE';

    if (!email || !password) {
      res.status(400).json({ message: 'Vui long nhap day du email va password.' });
      return;
    }

    if (!emailPattern.test(email) || email.length > 254) {
      res.status(400).json({ message: 'Email khong hop le.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password phai co it nhat 6 ky tu.' });
      return;
    }

    if (password.length > 128) {
      res.status(400).json({ message: 'Password khong duoc vuot qua 128 ky tu.' });
      return;
    }

    if (!isSelfRegisterRole(requestedRole)) {
      res.status(400).json({ message: 'Role dang ky chi duoc la CANDIDATE hoac RECRUITER.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email nay da duoc su dung.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const role = requestedRole as UserRole;

    const newUser = await prisma.user.create({
      data: { email, passwordHash, role },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({ message: 'Dang ky tai khoan thanh cong.', user: newUser });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Register API error:', err);
    res.status(500).json({ message: 'Loi server khi dang ky tai khoan.', error: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body ?? {};

    if (Object.keys(body).length === 0) {
      res.status(400).json({ message: 'Body khong duoc de trong.' });
      return;
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      res.status(400).json({ message: 'Vui long nhap day du email va password.' });
      return;
    }

    if (!emailPattern.test(email) || email.length > 254) {
      res.status(400).json({ message: 'Email khong hop le.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Tai khoan hoac mat khau khong chinh xac.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Tai khoan hoac mat khau khong chinh xac.' });
      return;
    }

    const secretKey = process.env.JWT_SECRET || 'srms_platform_secret_fallback_key';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secretKey,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Dang nhap thanh cong.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Login API error:', err);
    res.status(500).json({ message: 'Loi server khi dang nhap.', error: err.message });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Khong tim thay thong tin xac thuc.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      res.status(404).json({ message: 'Khong tim thay nguoi dung.' });
      return;
    }

    res.status(200).json({ user });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi lay thong tin nguoi dung.', error: err.message });
  }
};
