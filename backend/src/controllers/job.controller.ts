import { Request, Response } from 'express';
import prisma from '../config/db';

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

// 📂 API: Lấy danh sách toàn bộ tin tuyển dụng
export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await prisma.job.findMany({
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
