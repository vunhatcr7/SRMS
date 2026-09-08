import { Request, Response } from 'express';
import prisma from '../config/db';

const VALID_INTERVIEW_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];

const getApplication = async (applicationId: string) => {
  return prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true, candidateProfile: true },
  });
};

const canManageApplication = (
  userId: string,
  userRole: string,
  application: Awaited<ReturnType<typeof getApplication>>
) => {
  if (!application) {
    return false;
  }

  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return true;
  }

  return userRole === 'RECRUITER' && application.job.recruiterId === userId;
};

export const createInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { applicationId, scheduledAt, locationOrLink, interviewerName, type, notes } = req.body ?? {};
    const safeApplicationId = typeof applicationId === 'string'
      ? applicationId.trim()
      : Array.isArray(applicationId)
        ? applicationId[0]
        : '';

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    const safeLocationOrLink = typeof locationOrLink === 'string' ? locationOrLink.trim() : '';
    const safeInterviewerName = typeof interviewerName === 'string' ? interviewerName.trim() : '';

    if (!safeApplicationId || !scheduledAt || !safeLocationOrLink || !safeInterviewerName) {
      res.status(400).json({
        message: 'Thieu thong tin lich phong van. Can co: applicationId, scheduledAt, locationOrLink, interviewerName.',
      });
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      res.status(400).json({ message: 'Thoi gian phong van khong hop le.' });
      return;
    }

    const application = await getApplication(safeApplicationId);
    if (!application) {
      res.status(404).json({ message: 'Khong tim thay don ung tuyen.' });
      return;
    }

    if (!canManageApplication(userId, userRole, application)) {
      res.status(403).json({ message: 'Ban khong co quyen tao lich phong van cho don nay.' });
      return;
    }

    const safeType = typeof type === 'string' && type.trim() ? type.trim() : 'ONLINE';
    const safeNotes = typeof notes === 'string' && notes.trim() ? notes.trim() : null;

    const interview = await prisma.interview.create({
      data: {
        applicationId: safeApplicationId,
        scheduledAt: scheduledDate,
        locationOrLink: safeLocationOrLink,
        interviewerName: safeInterviewerName,
        status: 'SCHEDULED',
        type: safeType,
        notes: safeNotes,
      },
    });

    res.status(201).json({ message: 'Tao lich phong van thanh cong.', interview });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi tao lich phong van.', error: err.message });
  }
};

export const getRecruiterInterviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { status, jobId } = req.query ?? {};

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    const where: any = {};
    if (userRole === 'RECRUITER') {
      where.application = { job: { recruiterId: userId } };
    }

    if (typeof jobId === 'string' && jobId.trim() && jobId !== 'all') {
      where.application = {
        ...(where.application || {}),
        jobId: jobId.trim(),
      };
    }

    if (typeof status === 'string' && status.trim() && status !== 'all') {
      where.status = status.trim().toUpperCase();
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        application: {
          include: {
            job: {
              include: { company: { select: { name: true, logo: true } } },
            },
            candidateProfile: {
              include: {
                user: {
                  select: { id: true, fullName: true, email: true, phone: true, avatar: true },
                },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.status(200).json(interviews);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi lay danh sach phong van recruiter.', error: err.message });
  }
};

export const getCandidateInterviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    const interviews = await prisma.interview.findMany({
      where: {
        application: {
          candidateProfile: { userId },
        },
      },
      include: {
        application: {
          include: {
            job: {
              include: { company: { select: { name: true, logo: true } } },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.status(200).json(interviews);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi lay danh sach phong van candidate.', error: err.message });
  }
};

export const getInterviewsByApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const applicationId = Array.isArray(req.params.applicationId)
      ? req.params.applicationId[0]
      : req.params.applicationId;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    if (!applicationId) {
      res.status(400).json({ message: 'Thieu ma don ung tuyen.' });
      return;
    }

    const application = await getApplication(applicationId);
    if (!application) {
      res.status(404).json({ message: 'Khong tim thay don ung tuyen.' });
      return;
    }

    const isRecruiterManager = canManageApplication(userId, userRole, application);
    const isCandidateOwner = userRole === 'CANDIDATE' && application.candidateProfile?.userId === userId;

    if (!isRecruiterManager && !isCandidateOwner) {
      res.status(403).json({ message: 'Ban khong co quyen xem lich phong van cua don nay.' });
      return;
    }

    const interviews = await prisma.interview.findMany({
      where: { applicationId },
      orderBy: { scheduledAt: 'asc' },
    });

    res.status(200).json(interviews);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi lay lich phong van.', error: err.message });
  }
};

export const getInterviewById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const interviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!userId || !userRole || !interviewId) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: { include: { company: { select: { name: true, logo: true } } } },
            candidateProfile: {
              include: {
                user: { select: { id: true, fullName: true, email: true, phone: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    if (!interview) {
      res.status(404).json({ message: 'Khong tim thay lich phong van.' });
      return;
    }

    const isRecruiterOwner = userRole === 'RECRUITER' && interview.application.job.recruiterId === userId;
    const isCandidateOwner = userRole === 'CANDIDATE' && interview.application.candidateProfile.userId === userId;
    const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';

    if (!isRecruiterOwner && !isCandidateOwner && !isAdminOrManager) {
      res.status(403).json({ message: 'Ban khong co quyen xem lich phong van nay.' });
      return;
    }

    res.status(200).json(interview);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi lay chi tiet phong van.', error: err.message });
  }
};

export const updateInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const interviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { scheduledAt, locationOrLink, interviewerName, status, type, notes } = req.body ?? {};

    if (!userId || !userRole || !interviewId) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { application: { include: { job: true } } },
    });

    if (!interview) {
      res.status(404).json({ message: 'Khong tim thay lich phong van.' });
      return;
    }

    const application = interview.application;
    const canAccess = userRole === 'ADMIN'
      || userRole === 'MANAGER'
      || (userRole === 'RECRUITER' && application.job.recruiterId === userId);

    if (!canAccess) {
      res.status(403).json({ message: 'Ban khong co quyen cap nhat lich phong van nay.' });
      return;
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : undefined;
    if (scheduledDate && Number.isNaN(scheduledDate.getTime())) {
      res.status(400).json({ message: 'Thoi gian phong van khong hop le.' });
      return;
    }

    if (locationOrLink !== undefined && (typeof locationOrLink !== 'string' || !locationOrLink.trim())) {
      res.status(400).json({ message: 'locationOrLink khong hop le.' });
      return;
    }

    if (interviewerName !== undefined && (typeof interviewerName !== 'string' || !interviewerName.trim())) {
      res.status(400).json({ message: 'interviewerName khong hop le.' });
      return;
    }

    if (status !== undefined && (!VALID_INTERVIEW_STATUSES.includes(status.trim().toUpperCase()))) {
      res.status(400).json({ message: `status khong hop le. Chi chap nhan: ${VALID_INTERVIEW_STATUSES.join(', ')}` });
      return;
    }

    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        scheduledAt: scheduledDate,
        locationOrLink: locationOrLink ? locationOrLink.trim() : undefined,
        interviewerName: interviewerName ? interviewerName.trim() : undefined,
        status: status ? status.trim().toUpperCase() : undefined,
        type: type !== undefined ? (typeof type === 'string' && type.trim() ? type.trim() : 'ONLINE') : undefined,
        notes: notes !== undefined ? (typeof notes === 'string' && notes.trim() ? notes.trim() : null) : undefined,
      },
    });

    res.status(200).json({ message: 'Cap nhat lich phong van thanh cong.', interview: updatedInterview });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi cap nhat lich phong van.', error: err.message });
  }
};

export const cancelInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const interviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!userId || !userRole || !interviewId) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { application: { include: { job: true } } },
    });

    if (!interview) {
      res.status(404).json({ message: 'Khong tim thay lich phong van.' });
      return;
    }

    const canAccess = userRole === 'ADMIN'
      || userRole === 'MANAGER'
      || (userRole === 'RECRUITER' && interview.application.job.recruiterId === userId);

    if (!canAccess) {
      res.status(403).json({ message: 'Ban khong co quyen huy lich phong van nay.' });
      return;
    }

    const cancelled = await prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'CANCELLED' },
    });

    res.status(200).json({ message: 'Huy lich phong van thanh cong.', interview: cancelled });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi huy lich phong van.', error: err.message });
  }
};
