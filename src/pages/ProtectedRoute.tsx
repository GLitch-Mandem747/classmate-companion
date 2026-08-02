import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ requireAdmin = false }: ProtectedRouteProps) => {
  const { user, accessProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!accessProfile || !accessProfile.is_active) {
    return <Navigate to="/access-denied" replace />;
  }

  if (requireAdmin && accessProfile.role !== 'admin') {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
