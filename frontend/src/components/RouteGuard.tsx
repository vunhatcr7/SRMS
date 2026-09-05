import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type AppRole = 'ADMIN' | 'RECRUITER' | 'CANDIDATE';

interface RouteGuardProps {
  children: ReactNode;
  roles?: AppRole[];
}

interface StoredUser {
  role?: AppRole;
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

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'CANDIDATE' ? '/candidate' : user.role === 'ADMIN' ? '/admin' : '/recruiter';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
