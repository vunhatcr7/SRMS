import { Request, Response } from 'express';
import { ProcessStage } from '@prisma/client';
import prisma from '../config/db';
import { calculateMatching } from '../services/matching.service';

const validStages = Object.values(ProcessStage);
const isHttpUrl = (value: string): boolean => /^https?:\/\/\S+$/i.test(value);

export const applyJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const body = req.body ?? {};
    const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : '';
    const resumeUrl = typeof body.resumeUrl === 'string' ? body.resumeUrl.trim() : undefined;

    if (!userId) {
      res.status(401).json({ message: 'Vui long dang nhap bang tai khoan ung vien.' });
      return;
    }

    if (!jobId) {
      res.status(400).json({ message: 'Thieu jobId.' });
      return;
    }

    const jobExists = await prisma.job.findUnique({ where: { id: jobId } });
    if (!jobExists) {
      res.status(404).json({ message: 'Cong viec khong ton tai hoac da bi xoa.' });
      return;
    }

    if (!jobExists.isActive) {
      res.status(400).json({ message: 'Cong viec nay da dong nhan ho so.' });
      return;
    }

    if (resumeUrl && !isHttpUrl(resumeUrl)) {
      res.status(400).json({ message: 'resumeUrl phai la mot URL http(s) hop le.' });
      return;
    }

    let candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!candidateProfile) {
      candidateProfile = await prisma.candidateProfile.create({
        data: {
          userId,
          resumeUrl,
        },
      });
    }

    const alreadyApplied = await prisma.application.findFirst({
      where: {
        jobId,
        candidateId: candidateProfile.id,
      },
    });

    if (alreadyApplied) {
      res.status(400).json({ message: 'Ban da nop don ung tuyen cho cong viec nay roi.' });
      return;
    }

    const newApplication = await prisma.application.create({
      data: {
        jobId,
        candidateId: candidateProfile.id,
        stage: ProcessStage.APPLIED,
        ...calculateMatching(
          candidateProfile.skills,
          candidateProfile.experience,
          jobExists.requirements,
        ),
      },
    });

    res.status(201).json({
      message: 'Nop don ung tuyen thanh cong.',
      application: newApplication,
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi nop don ung tuyen.', error: err.message });
  }
};

export const getRecruiterApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = (req as any).user?.id;
    const requesterRole = (req as any).user?.role;

    if (!requesterId || !requesterRole) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    const where = requesterRole === 'RECRUITER'
      ? { job: { recruiterId: requesterId } }
      : {};

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: {
          select: { title: true, location: true },
        },
        candidateProfile: {
          include: {
            user: {
              select: { fullName: true, email: true, phone: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(applications);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi lay danh sach don ung tuyen.', error: err.message });
  }
};

export const getRankedApplicationsByJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = (req as any).user?.id;
    const requesterRole = (req as any).user?.role;
    const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0].trim() : req.params.jobId?.trim();

    if (!requesterId || !requesterRole) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    if (!jobId) {
      res.status(400).json({ message: 'Thieu jobId.' });
      return;
    }

    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true, title: true, recruiterId: true } });
    if (!job) {
      res.status(404).json({ message: 'Khong tim thay cong viec.' });
      return;
    }

    if (requesterRole === 'RECRUITER' && job.recruiterId !== requesterId) {
      res.status(403).json({ message: 'Ban khong co quyen xem xep hang cua cong viec nay.' });
      return;
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        candidateProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true, avatar: true } },
          },
        },
      },
      orderBy: [
        { matchingScore: 'desc' },
        { skillScore: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    res.status(200).json({
      job,
      total: applications.length,
      applications: applications.map((application, index) => ({
        rank: index + 1,
        ...application,
      })),
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi xep hang ung vien.', error: err.message });
  }
};

export const updateApplicationStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body ?? {};
    const applicationId = typeof body.applicationId === 'string' ? body.applicationId : '';
    const stage = typeof body.stage === 'string' ? body.stage.trim() : '';
    const requesterId = (req as any).user?.id;
    const requesterRole = (req as any).user?.role;

    if (!requesterId || !requesterRole) {
      res.status(401).json({ message: 'Vui long dang nhap.' });
      return;
    }

    if (!applicationId || !stage) {
      res.status(400).json({ message: 'Thieu applicationId hoac stage.' });
      return;
    }

    if (!validStages.includes(stage as ProcessStage)) {
      res.status(400).json({
        message: `Stage khong hop le. Chi chap nhan: ${validStages.join(', ')}.`,
      });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      res.status(404).json({ message: 'Khong tim thay don ung tuyen.' });
      return;
    }

    const canUpdate = requesterRole === 'ADMIN'
      || requesterRole === 'MANAGER'
      || application.job.recruiterId === requesterId;

    if (!canUpdate) {
      res.status(403).json({ message: 'Ban khong co quyen cap nhat don nay.' });
      return;
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { stage: stage as ProcessStage },
    });

    res.status(200).json({
      message: 'Cap nhat trang thai thanh cong.',
      application: updatedApplication,
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Loi server khi cap nhat trang thai.', error: err.message });
  }
};
