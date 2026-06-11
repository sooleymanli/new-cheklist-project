import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/shared/hooks/useStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
