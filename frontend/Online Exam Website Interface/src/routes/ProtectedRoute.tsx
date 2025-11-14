import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface Props {
  element: ReactElement;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ element, allowedRoles }: Props) {
  const { isAuthenticated, user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user?.role || '').toLowerCase();
    const ok = allowedRoles.some(r => r.toLowerCase() === role);
    if (!ok) {
      return <Navigate to="/403" replace />;
    }
  }

  return element;
}

