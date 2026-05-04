import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null; // or a fallback spinner
  }

  if (!isAuthenticated) {
    // Redirect them to the Home Page and append a parameter we can watch to spawn the Sign In Modal
    return <Navigate to="/?requiresLogin=true" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
