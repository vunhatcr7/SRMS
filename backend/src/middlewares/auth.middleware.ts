import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { isSupportedAppRole, unsupportedRoleError } from '../utils/app-roles';
import { getJwtSecret, JwtSecretConfigurationError } from '../utils/jwt-secret';

// 1. Bộ lọc kiểm tra Đăng nhập chung (Yêu cầu phải có Token hợp lệ)
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Lấy token từ header "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Bạn chưa đăng nhập hoặc Token không hợp lệ' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Giải mã mã khóa JWT
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; email: string; role: unknown };

    if (!isSupportedAppRole(decoded.role)) {
      res.status(403).json(unsupportedRoleError);
      return;
    }

    // Đút thông tin người dùng vào req để các controller phía sau sử dụng
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next(); // Cho phép đi tiếp vào Controller
  } catch (error) {
    if (error instanceof JwtSecretConfigurationError) {
      console.error('JWT authentication configuration error:', error.message);
      res.status(500).json({ message: 'Server authentication is not configured.' });
      return;
    }

    res.status(401).json({ message: 'Token đã hết hạn hoặc bị sai, vui lòng đăng nhập lại' });
  }
};

// 2. Bộ lọc phân quyền (Ví dụ: Chỉ cho phép ADMIN hoặc RECRUITER vào)
export const rolesAllowed = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Không tìm thấy thông tin xác thực' });
      return;
    }

    // Nếu Role của người dùng không nằm trong danh sách được phép
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Bạn không có quyền truy cập vào tính năng này' });
      return;
    }

    next(); // Hợp lệ thì cho qua cửa
  };
};