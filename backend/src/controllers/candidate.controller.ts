import { Request, Response } from 'express';
import prisma from '../config/db';

const normalizeSkills = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const getMyCandidateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập để xem hồ sơ ứng viên.' });
      return;
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({ message: 'Bạn chưa tạo hồ sơ ứng viên. Hãy tạo ngay để nộp đơn.' });
      return;
    }

    res.status(200).json(profile);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi lấy hồ sơ ứng viên', error: err.message });
  }
};

export const upsertMyCandidateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập để cập nhật hồ sơ.' });
      return;
    }

    const { skills, experience, education, resumeUrl } = req.body as {
      skills?: unknown;
      experience?: unknown;
      education?: unknown;
      resumeUrl?: string;
    };

    const normalizedSkills = normalizeSkills(skills);
    const existingProfile = await prisma.candidateProfile.findUnique({ where: { userId } });
    const safeExperience = experience === undefined || experience === null ? undefined : (experience as any);
    const safeEducation = education === undefined || education === null ? undefined : (education as any);

    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: {
        skills: normalizedSkills.length > 0 ? normalizedSkills : undefined,
        experience: safeExperience,
        education: safeEducation,
        resumeUrl: resumeUrl ?? undefined,
      },
      create: {
        userId,
        skills: normalizedSkills,
        experience: safeExperience,
        education: safeEducation,
        resumeUrl: resumeUrl ?? undefined,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    res.status(existingProfile ? 200 : 201).json({
      message: existingProfile ? 'Cập nhật hồ sơ ứng viên thành công.' : 'Tạo hồ sơ ứng viên thành công.',
      profile,
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi lưu hồ sơ ứng viên', error: err.message });
  }
};

export const getCandidateProfileByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = (req as any).user?.id;
    const requesterRole = (req as any).user?.role;
    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    if (!requesterId || !targetUserId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const isAuthorized = requesterId === targetUserId || ['ADMIN', 'MANAGER', 'RECRUITER'].includes(requesterRole);

    if (!isAuthorized) {
      res.status(403).json({ message: 'Bạn không có quyền xem hồ sơ này.' });
      return;
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({ message: 'Không tìm thấy hồ sơ ứng viên này.' });
      return;
    }

    res.status(200).json(profile);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi lấy hồ sơ ứng viên', error: err.message });
  }
};
