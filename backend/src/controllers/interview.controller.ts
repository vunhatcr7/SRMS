import { Request, Response } from 'express';
import prisma from '../config/db';

const VALID_INTERVIEW_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
const VALID_INTERVIEW_TYPES = ['ONLINE', 'OFFLINE'];
const ALLOWED_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  SCHEDULED: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED'],
};
const MAX_LOCATION_LENGTH = 2000;
const MAX_INTERVIEWER_NAME_LENGTH = 200;
const MAX_NOTES_LENGTH = 5000;

const parseScheduledAt = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const findScheduledConflict = async (
  applicationId: string,
  scheduledAt: Date,
  excludeInterviewId?: string,
) => prisma.interview.findFirst({
  where: {
    applicationId,
    scheduledAt,
    status: 'SCHEDULED',
    ...(excludeInterviewId ? { id: { not: excludeInterviewId } } : {}),
  },
  select: { id: true },
});

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
    const body = req.body ?? {};
    const safeApplicationId = typeof body.applicationId === 'string' ? body.applicationId.trim() : '';

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    const safeLocationOrLink = typeof body.locationOrLink === 'string' ? body.locationOrLink.trim() : '';
    const safeInterviewerName = typeof body.interviewerName === 'string' ? body.interviewerName.trim() : '';
    const scheduledDate = parseScheduledAt(body.scheduledAt);

    if (!safeApplicationId || !scheduledDate || !safeLocationOrLink || !safeInterviewerName) {
      res.status(400).json({
        message: 'Thieu thong tin lich phong van. Can co: applicationId, scheduledAt, locationOrLink, interviewerName.',
      });
      return;
    }

    if (safeLocationOrLink.length > MAX_LOCATION_LENGTH || safeInterviewerName.length > MAX_INTERVIEWER_NAME_LENGTH) {
      res.status(400).json({ message: 'Dia diem/link hoac ten nguoi phong van vuot qua do dai cho phep.' });
      return;
    }

    const safeType = body.type === undefined || body.type === null || body.type === ''
      ? 'ONLINE'
      : typeof body.type === 'string' ? body.type.trim().toUpperCase() : '';
    if (!VALID_INTERVIEW_TYPES.includes(safeType)) {
      res.status(400).json({ message: `type khong hop le. Chi chap nhan: ${VALID_INTERVIEW_TYPES.join(', ')}` });
      return;
    }

    if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
      res.status(400).json({ message: 'notes khong hop le.' });
      return;
    }
    const safeNotes = typeof body.notes === 'string' ? body.notes.trim() || null : null;
    if (safeNotes && safeNotes.length > MAX_NOTES_LENGTH) {
      res.status(400).json({ message: 'Ghi chu vuot qua do dai cho phep.' });
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

    const scheduledConflict = await findScheduledConflict(safeApplicationId, scheduledDate);
    if (scheduledConflict) {
      res.status(409).json({ message: 'Don ung tuyen da co lich phong van dang dien ra vao thoi diem nay.' });
      return;
    }

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
    const body = req.body ?? {};

    if (!userId || !userRole || !interviewId) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    const editableFields = ['scheduledAt', 'locationOrLink', 'interviewerName', 'status', 'type', 'notes'];
    if (!editableFields.some((field) => Object.prototype.hasOwnProperty.call(body, field))) {
      res.status(400).json({ message: 'Khong co thong tin hop le de cap nhat.' });
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

    const scheduledDate = body.scheduledAt === undefined
      ? undefined
      : parseScheduledAt(body.scheduledAt);
    if (body.scheduledAt !== undefined && !scheduledDate) {
      res.status(400).json({ message: 'Thoi gian phong van khong hop le.' });
      return;
    }

    if (body.locationOrLink !== undefined && (typeof body.locationOrLink !== 'string' || !body.locationOrLink.trim() || body.locationOrLink.trim().length > MAX_LOCATION_LENGTH)) {
      res.status(400).json({ message: 'locationOrLink khong hop le.' });
      return;
    }

    if (body.interviewerName !== undefined && (typeof body.interviewerName !== 'string' || !body.interviewerName.trim() || body.interviewerName.trim().length > MAX_INTERVIEWER_NAME_LENGTH)) {
      res.status(400).json({ message: 'interviewerName khong hop le.' });
      return;
    }

    let normalizedStatus: string | undefined;
    if (body.status !== undefined) {
      const candidateStatus = typeof body.status === 'string' ? body.status.trim().toUpperCase() : '';
      if (!VALID_INTERVIEW_STATUSES.includes(candidateStatus)) {
        res.status(400).json({ message: `status khong hop le. Chi chap nhan: ${VALID_INTERVIEW_STATUSES.join(', ')}` });
        return;
      }
      normalizedStatus = candidateStatus;
    }

    let normalizedType: string | undefined;
    if (body.type !== undefined) {
      const candidateType = body.type === null || body.type === ''
        ? 'ONLINE'
        : typeof body.type === 'string' ? body.type.trim().toUpperCase() : '';
      if (!VALID_INTERVIEW_TYPES.includes(candidateType)) {
        res.status(400).json({ message: `type khong hop le. Chi chap nhan: ${VALID_INTERVIEW_TYPES.join(', ')}` });
        return;
      }
      normalizedType = candidateType;
    }

    let normalizedNotes: string | null | undefined;
    if (body.notes !== undefined) {
      if (body.notes !== null && typeof body.notes !== 'string') {
        res.status(400).json({ message: 'notes khong hop le.' });
        return;
      }
      normalizedNotes = typeof body.notes === 'string' ? body.notes.trim() || null : null;
      if (normalizedNotes && normalizedNotes.length > MAX_NOTES_LENGTH) {
        res.status(400).json({ message: 'Ghi chu vuot qua do dai cho phep.' });
        return;
      }
    }

    const resultingStatus = normalizedStatus ?? interview.status;
    if (!ALLOWED_STATUS_TRANSITIONS[interview.status]?.includes(resultingStatus)) {
      res.status(409).json({ message: 'Khong the chuyen lich phong van sang trang thai nay.' });
      return;
    }

    if (
      resultingStatus === 'SCHEDULED'
      && (scheduledDate !== undefined || normalizedStatus === 'SCHEDULED')
      && await findScheduledConflict(
        interview.applicationId,
        scheduledDate ?? interview.scheduledAt,
        interviewId,
      )
    ) {
      res.status(409).json({ message: 'Don ung tuyen da co lich phong van dang dien ra vao thoi diem nay.' });
      return;
    }

    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        scheduledAt: scheduledDate ?? undefined,
        locationOrLink: body.locationOrLink !== undefined ? body.locationOrLink.trim() : undefined,
        interviewerName: body.interviewerName !== undefined ? body.interviewerName.trim() : undefined,
        status: normalizedStatus,
        type: normalizedType,
        notes: normalizedNotes,
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

    if (interview.status === 'COMPLETED') {
      res.status(409).json({ message: 'Khong the huy lich phong van da hoan thanh.' });
      return;
    }

    if (interview.status === 'CANCELLED') {
      res.status(200).json({ message: 'Lich phong van da duoc huy truoc do.', interview });
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
