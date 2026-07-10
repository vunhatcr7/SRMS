import { Request, Response } from 'express';
import prisma from '../config/db';

const getApplication = async (applicationId: string) => {
  return prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
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
    const { applicationId, scheduledAt, locationOrLink, interviewerName } = req.body ?? {};
    const safeApplicationId = typeof applicationId === 'string'
      ? applicationId
      : Array.isArray(applicationId)
        ? applicationId[0]
        : '';

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    if (!safeApplicationId || !scheduledAt || !locationOrLink || !interviewerName) {
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

    const interview = await prisma.interview.create({
      data: {
        applicationId: safeApplicationId,
        scheduledAt: scheduledDate,
        locationOrLink,
        interviewerName,
      },
    });

    res.status(201).json({ message: 'Tao lich phong van thanh cong.', interview });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi tao lich phong van.', error: err.message });
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

    if (!canManageApplication(userId, userRole, application)) {
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

export const updateInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const interviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { scheduledAt, locationOrLink, interviewerName } = req.body ?? {};

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

    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        scheduledAt: scheduledDate,
        locationOrLink: locationOrLink ?? undefined,
        interviewerName: interviewerName ?? undefined,
      },
    });

    res.status(200).json({ message: 'Cap nhat lich phong van thanh cong.', interview: updatedInterview });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi cap nhat lich phong van.', error: err.message });
  }
};
