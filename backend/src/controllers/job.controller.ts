import { Request, Response } from 'express';
import prisma from '../config/db';

const getJobId = (req: Request): string => Array.isArray(req.params.jobId) ? req.params.jobId[0].trim() : req.params.jobId?.trim() || '';
const canManageJob = (requesterId: string, requesterRole: string, recruiterId: string) => requesterRole === 'ADMIN' || requesterId === recruiterId;

// 🚀 API: Tạo tin tuyển dụng mới
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body ?? {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const requirements = typeof body.requirements === 'string' ? body.requirements.trim() : '';
    const salaryRange = typeof body.salaryRange === 'string' ? body.salaryRange.trim() : undefined;
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
    const rawBenefits = body.benefits;
    if (rawBenefits !== undefined && rawBenefits !== null && typeof rawBenefits !== 'string') {
      res.status(400).json({ message: 'Quyền lợi phải là chuỗi văn bản.' });
      return;
    }
    const benefits = typeof rawBenefits === 'string' ? rawBenefits.trim() || null : rawBenefits;

    // Lấy thông tin User từ token (đã qua middleware auth)
    const recruiterId = (req as any).user?.id;

    if (!recruiterId) {
      res.status(401).json({ message: 'Không tìm thấy thông tin người đăng tin, vui lòng đăng nhập lại!' });
      return;
    }

    if (!title || !description || !requirements || !location || !companyName) {
      res.status(400).json({
        message: 'Vui lòng nhập title, description, requirements, location và companyName.',
      });
      return;
    }

    if ([title, description, requirements, location, companyName].some((value) => value.length > 5000)) {
      res.status(400).json({ message: 'Nội dung tin tuyển dụng vượt quá độ dài cho phép.' });
      return;
    }
    if (typeof benefits === 'string' && benefits.length > 5000) {
      res.status(400).json({ message: 'Nội dung quyền lợi vượt quá độ dài cho phép.' });
      return;
    }

    // 1. Kiểm tra xem công ty đã tồn tại chưa, nếu chưa thì tự động tạo mới công ty đó luôn cho tiện
    let company = await prisma.company.findFirst({
      where: { name: companyName }
    });

    if (!company) {
      company = await prisma.company.create({
        data: { name: companyName }
      });
    }

    // 2. Tạo tin tuyển dụng (Job) gắn liền với Company và Recruiter
    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        requirements,
        salaryRange,
        location,
        benefits: benefits ?? undefined,
        companyId: company.id,
        recruiterId: recruiterId
      }
    });

    res.status(201).json({
      message: 'Đăng tin tuyển dụng thành công!',
      job: newJob
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi tạo tin tuyển dụng', error: err.message });
  }
};

export const getManagedJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = (req as any).user?.id;
    const requesterRole = (req as any).user?.role;
    const where = requesterRole === 'ADMIN' ? {} : { recruiterId: requesterId };
    const jobs = await prisma.job.findMany({
      where,
      include: { company: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(jobs);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách việc làm quản lý.', error: err.message });
  }
};

export const getManagedJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = (req as any).user?.id;
    const requesterRole = (req as any).user?.role;
    const jobId = getJobId(req);
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { company: true, _count: { select: { applications: true } } } });
    if (!job) {
      res.status(404).json({ message: 'Không tìm thấy công việc.' });
      return;
    }
    if (!canManageJob(requesterId, requesterRole, job.recruiterId)) {
      res.status(403).json({ message: 'Bạn không có quyền quản lý công việc này.' });
      return;
    }
    res.status(200).json(job);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi lấy công việc quản lý.', error: err.message });
  }
};

export const updateManagedJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = (req as any).user?.id;
    const requesterRole = (req as any).user?.role;
    const jobId = getJobId(req);
    const body = req.body ?? {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const requirements = typeof body.requirements === 'string' ? body.requirements.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    const salaryRange = typeof body.salaryRange === 'string' ? body.salaryRange.trim() : null;
    const rawBenefits = body.benefits;
    if (rawBenefits !== undefined && rawBenefits !== null && typeof rawBenefits !== 'string') {
      res.status(400).json({ message: 'Quyền lợi phải là chuỗi văn bản.' });
      return;
    }
    const benefits = typeof rawBenefits === 'string' ? rawBenefits.trim() || null : rawBenefits;
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : undefined;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ message: 'Không tìm thấy công việc.' });
      return;
    }
    if (!canManageJob(requesterId, requesterRole, job.recruiterId)) {
      res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa công việc này.' });
      return;
    }
    if (!title || !description || !requirements || !location) {
      res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin công việc.' });
      return;
    }
    if (typeof benefits === 'string' && benefits.length > 5000) {
      res.status(400).json({ message: 'Nội dung quyền lợi vượt quá độ dài cho phép.' });
      return;
    }
    const updatedJob = await prisma.job.update({ where: { id: jobId }, data: { title, description, requirements, location, salaryRange, ...(benefits === undefined ? {} : { benefits }), ...(isActive === undefined ? {} : { isActive }) }, include: { company: true, _count: { select: { applications: true } } } });
    res.status(200).json({ message: 'Cập nhật công việc thành công.', job: updatedJob });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi cập nhật công việc.', error: err.message });
  }
};

export const toggleManagedJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = (req as any).user?.id;
    const requesterRole = (req as any).user?.role;
    const jobId = getJobId(req);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ message: 'Không tìm thấy công việc.' });
      return;
    }
    if (!canManageJob(requesterId, requesterRole, job.recruiterId)) {
      res.status(403).json({ message: 'Bạn không có quyền thay đổi trạng thái công việc này.' });
      return;
    }
    const updatedJob = await prisma.job.update({ where: { id: jobId }, data: { isActive: !job.isActive }, include: { company: true, _count: { select: { applications: true } } } });
    res.status(200).json({ message: updatedJob.isActive ? 'Đã mở lại công việc.' : 'Đã đóng công việc.', job: updatedJob });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi thay đổi trạng thái công việc.', error: err.message });
  }
};

// 📂 API: Lấy danh sách toàn bộ tin tuyển dụng
export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.active === 'true';
    const jobs = await prisma.job.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        company: true // Lấy kèm luôn thông tin công ty
      },
      orderBy: { createdAt: 'desc' } // Tin mới nhất lên đầu
    });
    res.status(200).json(jobs);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách job', error: err.message });
  }
};

export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0].trim() : req.params.jobId?.trim();

    if (!jobId) {
      res.status(400).json({ message: 'Thiếu jobId.' });
      return;
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, isActive: true },
      include: { company: true },
    });

    if (!job) {
      res.status(404).json({ message: 'Không tìm thấy công việc đang tuyển.' });
      return;
    }

    res.status(200).json(job);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết công việc', error: err.message });
  }
};
