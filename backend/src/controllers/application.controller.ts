import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const applyJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, resumeUrl, coverLetter } = req.body;
    const userId = (req as any).user?.id; // Đây là ID lấy từ bảng User thông qua Token

    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập với tài khoản ứng viên!' });
      return;
    }

    // 🔥 BƯỚC THÊM MỚI: Đi tìm hồ sơ CandidateProfile của User này
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: userId }
    });

    // Nếu user chưa có hồ sơ ứng viên, tự động tạo mới luôn để tránh lỗi
    let candidateId = candidateProfile?.id;
    if (!candidateId) {
      const newProfile = await prisma.candidateProfile.create({
        data: { 
          userId: userId,
          resumeUrl: resumeUrl // Lưu luôn link CV vào hồ sơ cá nhân
        }
      });
      candidateId = newProfile.id;
    }

    // 1. Kiểm tra xem Job này có tồn tại không
    const jobExists = await prisma.job.findUnique({ where: { id: jobId } });
    if (!jobExists) {
      res.status(404).json({ message: 'Công việc này không tồn tại hoặc đã bị xóa!' });
      return;
    }

    // 2. Kiểm tra xem ứng viên đã nộp đơn vào Job này chưa (Dùng candidateId chuẩn vừa tìm được)
    const alreadyApplied = await prisma.application.findFirst({
      where: { jobId, candidateId }
    });

    if (alreadyApplied) {
      res.status(400).json({ message: 'Bạn đã nộp đơn ứng tuyển cho công việc này rồi!' });
      return;
    }

    // 3. Tạo đơn ứng tuyển mới với candidateId chuẩn chỉnh của bảng CandidateProfile
    const newApplication = await prisma.application.create({
      data: {
        jobId,
        candidateId, // ID chuẩn của bảng CandidateProfile
        stage: 'APPLIED' // Trạng thái mặc định khớp với enum ProcessStage trong prisma của bạn
      }
    });

    res.status(201).json({
      message: 'Nộp đơn ứng tuyển thành công! Chúc bạn may mắn.',
      application: newApplication
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ message: 'Lỗi server khi nộp đơn ứng tuyển', error: err.message });
  }
};