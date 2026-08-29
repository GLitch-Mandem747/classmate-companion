import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ requireAdmin = false }: ProtectedRouteProps) => {
  const {
    user,
    accessProfile,
    accessProfileLoading,
    loading
  } = useAuth();

  if (loading || (user && accessProfileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!accessProfile) {
    return <Navigate to="/access-denied" replace />;
  }

  if (!accessProfile.is_active) {
    return <Navigate to="/access-denied" replace />;
  }

  if (requireAdmin && accessProfile.role !== 'admin') {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
