import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import prisma from '../config/db';

const ADMIN_USER_ROLES = [UserRole.CANDIDATE, UserRole.RECRUITER];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const parsePositiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const getAdminDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalCandidates, totalRecruiters, totalJobs, totalApplications] = await Promise.all([
      prisma.user.count({ where: { role: UserRole.CANDIDATE } }),
      prisma.user.count({ where: { role: UserRole.RECRUITER } }),
      prisma.job.count(),
      prisma.application.count(),
    ]);

    res.status(200).json({
      summary: { totalCandidates, totalRecruiters, totalJobs, totalApplications },
    });
  } catch (error: unknown) {
    console.error('Admin dashboard query failed:', error);
    res.status(500).json({ message: 'Không thể tải thống kê quản trị.' });
  }
};

export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const roleQuery = typeof req.query.role === 'string' ? req.query.role.toUpperCase() : 'ALL';
    if (!['ALL', ...ADMIN_USER_ROLES].includes(roleQuery as UserRole | 'ALL')) {
      res.status(400).json({ message: 'Bộ lọc vai trò không hợp lệ.' });
      return;
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const requestedPage = parsePositiveInteger(req.query.page, 1);
    const requestedPageSize = parsePositiveInteger(req.query.limit, DEFAULT_PAGE_SIZE);
    const limit = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    const where = {
      role: roleQuery === 'ALL'
        ? { in: ADMIN_USER_ROLES }
        : roleQuery as UserRole,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const total = await prisma.user.count({ where });
    const totalPages = Math.ceil(total / limit);
    const page = Math.min(requestedPage, Math.max(totalPages, 1));
    const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      });

    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: unknown) {
    console.error('Admin user list query failed:', error);
    res.status(500).json({ message: 'Không thể tải danh sách tài khoản.' });
  }
};
