import { Request, Response } from 'express';
import prisma from '../config/db';

const buildStageSummary = (items: Array<{ stage: string; _count: { _all: number } }>) => {
  const summary: Record<string, number> = {
    APPLIED: 0,
    SCREENING: 0,
    INTERVIEW: 0,
    OFFER: 0,
    HIRED: 0,
    REJECTED: 0,
  };

  items.forEach((item) => {
    summary[item.stage] = item._count._all;
  });

  return summary;
};

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const jobWhere = userRole === 'RECRUITER' ? { recruiterId: userId } : {};
    const applicationWhere = userRole === 'CANDIDATE'
      ? { candidateProfile: { userId } }
      : userRole === 'RECRUITER'
        ? { job: { recruiterId: userId } }
        : {};

    const [totalJobs, activeJobs, totalApplications, pendingApplications, scheduledInterviews, hiredCount, applicationsByStage, recentApplications] = await Promise.all([
      prisma.job.count({ where: jobWhere }),
      prisma.job.count({ where: { ...jobWhere, isActive: true } }),
      prisma.application.count({ where: applicationWhere }),
      prisma.application.count({ where: { ...applicationWhere, stage: { in: ['APPLIED', 'SCREENING', 'INTERVIEW'] } } }),
      prisma.interview.count({ where: userRole === 'RECRUITER' ? { application: { job: { recruiterId: userId } } } : userRole === 'CANDIDATE' ? { application: { candidateProfile: { userId } } } : {} }),
      prisma.application.count({ where: { ...applicationWhere, stage: 'HIRED' } }),
      prisma.application.groupBy({
        by: ['stage'],
        where: applicationWhere,
        _count: { _all: true },
      }),
      prisma.application.findMany({
        where: applicationWhere,
        include: {
          job: { select: { title: true, location: true } },
          candidateProfile: { include: { user: { select: { fullName: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.status(200).json({
      role: userRole,
      summary: {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        scheduledInterviews,
        hiredCount,
        applicationsByStage: buildStageSummary(applicationsByStage),
      },
      recentApplications,
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê dashboard', error: err.message });
  }
};
