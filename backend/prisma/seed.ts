import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang bắt đầu quá trình Seed dữ liệu...');

  // 1. Dọn sạch dữ liệu cũ
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password123@', salt);

  console.log('🧹 Đã xóa dữ liệu cũ và chuẩn bị mã hóa mật khẩu.');

  // 2. Tạo dữ liệu mẫu
  const admin = await prisma.user.create({
    data: {
      email: 'admin@srms.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
    },
  });

  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@fpt.com',
      passwordHash: defaultPasswordHash,
      role: 'RECRUITER',
    },
  });

  const interviewer = await prisma.user.create({
    data: {
      email: 'interviewer1@srms.com',
      passwordHash: defaultPasswordHash,
      role: 'INTERVIEWER',
    },
  });

  const candidate = await prisma.user.create({
    data: {
      email: 'nguyenvana@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'CANDIDATE',
    },
  });

  console.log('✅ Đã khởi tạo thành công 4 tài khoản mẫu.');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });