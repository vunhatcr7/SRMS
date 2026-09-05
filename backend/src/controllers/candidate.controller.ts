import { Request, Response } from 'express';
import prisma from '../config/db';
import { extractResumeText } from '../services/resume-parser.service';
import { parseResumeWithAI } from '../services/resume-ai.service';

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

const isHttpUrl = (value: string): boolean => /^https?:\/\/\S+$/i.test(value);

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

    const body = req.body ?? {};
    const { fullName, phone, skills, experience, education, resumeUrl } = body as {
      fullName?: string;
      phone?: string;
      skills?: unknown;
      experience?: unknown;
      education?: unknown;
      resumeUrl?: string;
    };

    const normalizedFullName = typeof fullName === 'string' ? fullName.trim() : undefined;
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : undefined;

    if (normalizedFullName !== undefined && normalizedFullName.length > 120) {
      res.status(400).json({ message: 'Họ tên không được vượt quá 120 ký tự.' });
      return;
    }

    if (normalizedPhone !== undefined && normalizedPhone.length > 30) {
      res.status(400).json({ message: 'Số điện thoại không được vượt quá 30 ký tự.' });
      return;
    }

    const normalizedSkills = normalizeSkills(skills);
    if (normalizedSkills.length > 50 || normalizedSkills.some((skill) => skill.length > 100)) {
      res.status(400).json({ message: 'Danh sach ky nang khong hop le.' });
      return;
    }

    if (resumeUrl !== undefined && (typeof resumeUrl !== 'string' || !isHttpUrl(resumeUrl.trim()))) {
      res.status(400).json({ message: 'resumeUrl phai la mot URL http(s) hop le.' });
      return;
    }
    const existingProfile = await prisma.candidateProfile.findUnique({ where: { userId } });
    const safeExperience = experience === undefined || experience === null ? undefined : (experience as any);
    const safeEducation = education === undefined || education === null ? undefined : (education as any);

    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: {
        skills: skills === undefined ? undefined : normalizedSkills,
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

    if (normalizedFullName !== undefined || normalizedPhone !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          fullName: normalizedFullName,
          phone: normalizedPhone,
        },
      });
    }

    const profileWithUser = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { fullName: true, email: true, phone: true, avatar: true },
        },
      },
    });

    res.status(existingProfile ? 200 : 201).json({
      message: existingProfile ? 'Cập nhật hồ sơ ứng viên thành công.' : 'Tạo hồ sơ ứng viên thành công.',
      profile: profileWithUser ?? profile,
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi lưu hồ sơ ứng viên', error: err.message });
  }
};

export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const file = req.file;

    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập để tải CV.' });
      return;
    }

    if (!file) {
      res.status(400).json({ message: 'Vui lòng gửi file CV với field name là resume.' });
      return;
    }

    const resumeText = await extractResumeText(file);
    if (!resumeText.trim()) {
      res.status(400).json({ message: 'Không thể trích xuất nội dung từ CV này.' });
      return;
    }

    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: { resumeUrl: file.originalname, resumeText },
      create: { userId, resumeUrl: file.originalname, resumeText },
      select: { id: true, userId: true, resumeUrl: true, resumeText: true, createdAt: true },
    });

    res.status(200).json({
      message: 'Tải và đọc CV thành công.',
      resume: { fileName: file.originalname, mimeType: file.mimetype, textLength: resumeText.length },
      profile,
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(400).json({ message: `Không thể đọc CV: ${err.message}` });
  }
};

export const parseResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập để phân tích CV.' });
      return;
    }

    const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile?.resumeText?.trim()) {
      res.status(400).json({ message: 'Hãy tải CV trước khi yêu cầu phân tích.' });
      return;
    }

    const parsedResume = await parseResumeWithAI(profile.resumeText);
    res.status(200).json({ message: 'Phân tích CV thành công. Hãy kiểm tra và lưu thông tin.', parsedResume });
  } catch (error: unknown) {
    const err = error as Error;
    const status = err.message.includes('AI_API_KEY') ? 503 : 502;
    res.status(status).json({ message: `Không thể phân tích CV: ${err.message}` });
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
