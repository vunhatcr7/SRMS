import { PrismaClient } from '@prisma/client';

// Khởi tạo một thực thể PrismaClient duy nhất (Singleton Pattern)
const prisma = new PrismaClient();

export default prisma;