import { Request, Response } from 'express';
import prisma from '../config/db';

const canManageApplication = async (userId: string, userRole: string, applicationId: string) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) {
    return null;
  }

  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return application;
  }

  if (userRole === 'RECRUITER' && application.job.recruiterId === userId) {
    return application;
  }

  return null;
};

export const createInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { applicationId, scheduledAt, locationOrLink, interviewerName } = req.body;
    const safeApplicationId = typeof applicationId === 'string' ? applicationId : Array.isArray(applicationId) ? applicationId[0] : '';

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    if (!safeApplicationId || !scheduledAt || !locationOrLink || !interviewerName) {
      res.status(400).json({ message: 'Thiếu thông tin lịch phỏng vấn.' });
      return;
    }

    const application = await canManageApplication(userId, userRole, safeApplicationId);

    if (!application) {
      res.status(403).json({ message: 'Bạn không có quyền tạo lịch phỏng vấn cho đơn này.' });
      return;
    }

    const interview = await prisma.interview.create({
      data: {
        applicationId: safeApplicationId,
        scheduledAt: new Date(scheduledAt),
        locationOrLink,
        interviewerName,
      },
    });

    res.status(201).json({ message: 'Tạo lịch phỏng vấn thành công.', interview });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi tạo lịch phỏng vấn', error: err.message });
  }
};

export const getInterviewsByApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const applicationId = Array.isArray(req.params.applicationId) ? req.params.applicationId[0] : req.params.applicationId;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const application = await canManageApplication(userId, userRole, applicationId);

    if (!application) {
      res.status(403).json({ message: 'Bạn không có quyền xem lịch phỏng vấn này.' });
      return;
    }

    const interviews = await prisma.interview.findMany({
      where: { applicationId },
      orderBy: { scheduledAt: 'asc' },
    });

    res.status(200).json(interviews);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi lấy lịch phỏng vấn', error: err.message });
  }
};

export const updateInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const interviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { scheduledAt, locationOrLink, interviewerName } = req.body;

    if (!userId || !userRole || !interviewId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { application: { include: { job: true } } },
    });

    if (!interview) {
      res.status(404).json({ message: 'Không tìm thấy lịch phỏng vấn.' });
      return;
    }

    const application = interview.application;
    const canAccess = userRole === 'ADMIN' || userRole === 'MANAGER' || (userRole === 'RECRUITER' && application.job.recruiterId === userId);

    if (!canAccess) {
      res.status(403).json({ message: 'Bạn không có quyền cập nhật lịch phỏng vấn này.' });
      return;
    }

    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        locationOrLink: locationOrLink ?? undefined,
        interviewerName: interviewerName ?? undefined,
      },
    });

    res.status(200).json({ message: 'Cập nhật lịch phỏng vấn thành công.', interview: updatedInterview });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi cập nhật lịch phỏng vấn', error: err.message });
  }
};
