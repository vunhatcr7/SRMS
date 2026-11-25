import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAppRole, roleWorkspaces, type AppRole } from '../utils/appRoles';

interface RouteGuardProps {
  children: ReactNode;
  roles?: AppRole[];
}

interface StoredUser {
  role?: unknown;
}

const getStoredUser = (): StoredUser | null => {
  const value = localStorage.getItem('user');
  if (!value) return null;

  try {
    return JSON.parse(value) as StoredUser;
  } catch {
    return null;
  }
};

export default function RouteGuard({ children, roles }: RouteGuardProps) {
  const location = useLocation();
  const token = localStorage.getItem('srms_token');
  const user = getStoredUser();

  if (!token || !user?.role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAppRole(user.role)) {
    return <Navigate to="/login" replace state={{ unsupportedRole: true }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleWorkspaces[user.role]} replace />;
  }

  return <>{children}</>;
}
