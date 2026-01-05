import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../common/Loading';
import { ROUTES } from '../../utils/constants';

export const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { loading, getUserRole } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  const userRole = getUserRole();
  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole?.name);

  if (!hasAccess) {
    // Redirect based on role
    if (userRole?.name === 'platform_super_admin') {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }
    if (userRole?.name === 'company_admin') {
      // Get companyId from user roles
      const companyId = userRole?.company_id || '';
      if (companyId) {
        return <Navigate to={ROUTES.COMPANY.DASHBOARD(companyId)} replace />;
      }
      return <Navigate to={ROUTES.COMPANY.LOGIN} replace />;
    }
    if (userRole?.name === 'branch_manager' || userRole?.name === 'staff') {
      // Need companyId and branchId from user context
      return <Navigate to="/" replace />;
    }
    return <Navigate to={ROUTES.CUSTOMER.HOME} replace />;
  }

  return children;
};

