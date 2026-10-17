import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

// Wraps pages that need a logged-in user; otherwise redirects to /login
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// The opposite: login/register pages redirect home if already logged in
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Checking your session..." />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
