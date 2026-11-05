import { Request, Response } from 'express';
import path from 'path';
import prisma from '../config/db';
import { extractResumeText } from '../services/resume-parser.service';
import { parseResumeWithAI } from '../services/resume-ai.service';
import {
  InvalidResumeFileError,
  MAX_RESUME_FILE_SIZE,
  readResumeFile,
  removeResumeFile,
  ResumeFileNotFoundError,
  storeResumeFile,
  validateResumeFile,
} from '../services/resume-storage.service';

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
  const userId = req.user?.id;
  const file = req.file;

  if (!userId) {
    res.status(401).json({ message: 'Vui lòng đăng nhập để tải CV.' });
    return;
  }

  if (!file) {
    res.status(400).json({ message: 'Vui lòng gửi file CV với field name là resume.' });
    return;
  }

  if (!file.size || file.size > MAX_RESUME_FILE_SIZE || file.size !== file.buffer.length) {
    res.status(400).json({ message: 'File CV phải có dung lượng từ 1 byte đến 5 MB.' });
    return;
  }

  let mimeType: string;
  let resumeText: string;
  try {
    mimeType = validateResumeFile(file);
    resumeText = await extractResumeText({ ...file, mimetype: mimeType });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'File CV không hợp lệ.';
    res.status(error instanceof InvalidResumeFileError ? 400 : 422).json({ message });
    return;
  }

  let existingProfile;
  try {
    existingProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: { resumeStorageKey: true },
    });
  } catch (error: unknown) {
    console.error('Failed to load candidate CV metadata:', error);
    res.status(500).json({ message: 'Không thể đọc hồ sơ ứng viên trước khi thay CV.' });
    return;
  }

  let storageKey: string;
  try {
    storageKey = await storeResumeFile(userId, file.buffer);
  } catch (error: unknown) {
    console.error('Failed to store candidate CV:', error);
    res.status(500).json({ message: 'Không thể lưu CV vào kho lưu trữ.' });
    return;
  }

  let profile;
  try {
    profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: {
        resumeStorageKey: storageKey,
        resumeFileName: path.basename(file.originalname.replace(/\\/g, '/')),
        resumeMimeType: mimeType,
        resumeFileSize: file.size,
        resumeUrl: null,
        resumeText: resumeText || null,
      },
      create: {
        userId,
        resumeStorageKey: storageKey,
        resumeFileName: path.basename(file.originalname.replace(/\\/g, '/')),
        resumeMimeType: mimeType,
        resumeFileSize: file.size,
        resumeUrl: null,
        resumeText: resumeText || null,
      },
      select: {
        id: true,
        userId: true,
        resumeUrl: true,
        resumeFileName: true,
        resumeMimeType: true,
        resumeFileSize: true,
        createdAt: true,
      },
    });
  } catch (error: unknown) {
    try {
      await removeResumeFile(userId, storageKey);
    } catch (cleanupError: unknown) {
      console.error('Failed to clean up unlinked CV file:', cleanupError);
    }
    console.error('Failed to save candidate CV metadata:', error);
    res.status(500).json({ message: 'Không thể liên kết CV với hồ sơ ứng viên.' });
    return;
  }

  let cleanupWarning: string | undefined;
  if (existingProfile?.resumeStorageKey && existingProfile.resumeStorageKey !== storageKey) {
    try {
      await removeResumeFile(userId, existingProfile.resumeStorageKey);
    } catch (error: unknown) {
      cleanupWarning = 'CV mới đã được lưu, nhưng chưa xóa được bản CV cũ.';
      console.error('Failed to remove replaced candidate CV:', error);
    }
  }

  res.status(200).json({
    message: cleanupWarning || 'Tải CV thành công.',
    ...(cleanupWarning ? { warning: cleanupWarning } : {}),
    resume: {
      fileName: profile.resumeFileName,
      mimeType: profile.resumeMimeType,
      size: profile.resumeFileSize,
    },
    profile,
  });
};

const sanitizeDownloadFilename = (filename: string): { fallback: string; encoded: string } => {
  const safeFilename = path.basename(filename.replace(/\\/g, '/')).replace(/[\\/\r\n"]/g, '_') || 'resume';
  const fallback = safeFilename.replace(/[^\x20-\x7e]/g, '_');
  const encoded = encodeURIComponent(safeFilename).replace(/['()*]/g, (character) => (
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  ));
  return { fallback, encoded };
};

const sendResumeFile = async (
  req: Request,
  res: Response,
  candidateUserId: string,
  allowRecruiterAccess: boolean,
): Promise<void> => {
  const requesterId = req.user?.id;
  const requesterRole = req.user?.role;

  if (!requesterId || !requesterRole) {
    res.status(401).json({ message: 'Vui lòng đăng nhập.' });
    return;
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: candidateUserId },
    select: {
      id: true,
      userId: true,
      resumeStorageKey: true,
      resumeFileName: true,
      resumeMimeType: true,
      resumeFileSize: true,
    },
  });

  if (!profile) {
    res.status(404).json({ message: 'Không tìm thấy hồ sơ ứng viên.' });
    return;
  }

  if (requesterRole === 'CANDIDATE' && requesterId !== profile.userId) {
    res.status(403).json({ message: 'Bạn không có quyền truy cập CV này.' });
    return;
  }

  if (requesterRole === 'RECRUITER') {
    if (!allowRecruiterAccess) {
      res.status(403).json({ message: 'Bạn không có quyền truy cập CV này.' });
      return;
    }

    const hasRecruiterApplication = await prisma.application.findFirst({
      where: {
        candidateId: profile.id,
        job: { recruiterId: requesterId },
      },
      select: { id: true },
    });

    if (!hasRecruiterApplication) {
      res.status(403).json({ message: 'Bạn chỉ có thể xem CV của ứng viên đã ứng tuyển vào công việc mình quản lý.' });
      return;
    }
  }

  if (!profile.resumeStorageKey || !profile.resumeFileName || !profile.resumeMimeType) {
    res.status(404).json({ message: 'Ứng viên chưa có CV được lưu trữ trên hệ thống.' });
    return;
  }

  if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(profile.resumeMimeType)) {
    res.status(500).json({ message: 'Loại file CV trong dữ liệu lưu trữ không hợp lệ.' });
    return;
  }

  let buffer: Buffer;
  try {
    buffer = await readResumeFile(profile.userId, profile.resumeStorageKey);
  } catch (error: unknown) {
    if (error instanceof ResumeFileNotFoundError) {
      res.status(404).json({ message: 'Không tìm thấy file CV trong kho lưu trữ.' });
      return;
    }
    console.error('Failed to read candidate CV:', error);
    res.status(500).json({ message: 'Không thể đọc file CV từ kho lưu trữ.' });
    return;
  }

  const { fallback, encoded } = sanitizeDownloadFilename(profile.resumeFileName);
  const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
  res.setHeader('Content-Type', profile.resumeMimeType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Content-Disposition', `${disposition}; filename="${fallback}"; filename*=UTF-8''${encoded}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(buffer);
};

export const getMyResume = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Vui lòng đăng nhập.' });
    return;
  }

  try {
    await sendResumeFile(req, res, userId, false);
  } catch (error: unknown) {
    console.error('Failed to retrieve candidate CV:', error);
    res.status(500).json({ message: 'Không thể tải CV.' });
  }
};

export const getCandidateResume = async (req: Request, res: Response): Promise<void> => {
  const candidateUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  if (!candidateUserId) {
    res.status(400).json({ message: 'Thiếu mã ứng viên.' });
    return;
  }

  try {
    await sendResumeFile(req, res, candidateUserId, true);
  } catch (error: unknown) {
    console.error('Failed to retrieve candidate CV:', error);
    res.status(500).json({ message: 'Không thể tải CV.' });
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
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;
    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    if (!requesterId || !targetUserId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    let isAuthorized = requesterId === targetUserId || requesterRole === 'ADMIN' || requesterRole === 'MANAGER';

    if (!isAuthorized && requesterRole === 'RECRUITER') {
      const profile = await prisma.candidateProfile.findUnique({
        where: { userId: targetUserId },
        select: { id: true },
      });

      if (profile) {
        const application = await prisma.application.findFirst({
          where: {
            candidateId: profile.id,
            job: { recruiterId: requesterId },
          },
          select: { id: true },
        });
        isAuthorized = Boolean(application);
      }
    }

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
