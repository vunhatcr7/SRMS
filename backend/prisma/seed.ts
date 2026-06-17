import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang bắt đầu quá trình Seed dữ liệu...');

  // 1. Dọn sạch dữ liệu cũ trong DB
  await prisma.user.deleteMany({});

  // 2. Tạo độ muối để băm mật khẩu
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password123@', salt);

  console.log('🧹 Đã xóa dữ liệu cũ và chuẩn bị mã hóa mật khẩu.');

  // 3. Tạo dữ liệu mẫu cho bảng User (Truyền thẳng String Enum vào)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@srms.com',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN', // 🔥 Sửa thành chuỗi string viết hoa
    },
  });

  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@fpt.com',
      passwordHash: defaultPasswordHash,
      role: 'RECRUITER', // 🔥 Sửa thành chuỗi string viết hoa
    },
  });

  const interviewer = await prisma.user.create({
    data: {
      email: 'interviewer1@srms.com',
      passwordHash: defaultPasswordHash,
      role: 'INTERVIEWER', // 🔥 Sửa thành chuỗi string viết hoa
    },
  });

  const candidate = await prisma.user.create({
    data: {
      email: 'nguyenvana@gmail.com',
      passwordHash: defaultPasswordHash,
      role: 'CANDIDATE', // 🔥 Sửa thành chuỗi string viết hoa
    },
  });

  console.log('✅ Đã khởi tạo thành công 4 tài khoản mẫu:');
  console.log(`   - Admin: ${admin.email}`);
  console.log(`   - Recruiter: ${recruiter.email}`);
  console.log(`   - Interviewer: ${interviewer.email}`);
  console.log(`   - Candidate: ${candidate.email}`);
  console.log(`🔒 Mật khẩu chung cho tất cả tài khoản: Password123@`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi xảy ra trong quá trình seed dữ liệu:', e);
    // Bỏ hẳn process.exit để không bị lỗi TypeScript gạch chân hệ thống
  })
  .finally(async () => {
    await prisma.$disconnect();
  });