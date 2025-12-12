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
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center p-4">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Đang kiểm tra xác thực...</h5>
          <p className="text-muted mb-0">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ ProtectedRoute: Allowing access without authentication in development');
    } else {
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
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
