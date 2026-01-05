import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../common/Loading';
import { ROUTES, USER_ROLES } from '../../utils/constants';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to appropriate login based on route
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to={ROUTES.ADMIN.LOGIN} state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/company')) {
      return <Navigate to={ROUTES.COMPANY.LOGIN} state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/branch')) {
      return <Navigate to={ROUTES.BRANCH.LOGIN} state={{ from: location }} replace />;
    }
    return <Navigate to={ROUTES.CUSTOMER.LOGIN} state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};


