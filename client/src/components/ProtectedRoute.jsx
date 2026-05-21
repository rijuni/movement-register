import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const userData = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  
  if (!userData) {
    // If not logged in, redirect to login page
    return <Navigate to="/admin" replace />;
  }

  const user = JSON.parse(userData);

  // If role is not allowed, redirect to dashboard/home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
