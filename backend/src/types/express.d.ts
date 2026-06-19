import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole; // Hoặc dùng string nếu trong schema bạn để dạng String
      };
    }
  }
}