import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { RoleRoute } from './components/routes/RoleRoute';
import { USER_ROLES, ROUTES } from './utils/constants';
import { LoginPage as AdminLoginPage } from './pages/admin/LoginPage';
import { DashboardPage as AdminDashboardPage } from './pages/admin/DashboardPage';
import { CompaniesPage as AdminCompaniesPage } from './pages/admin/CompaniesPage';
import { CompanyDetailPage } from './pages/admin/CompanyDetailPage';
import { CompanyFormPage } from './pages/admin/CompanyFormPage';
import { ActivityPage } from './pages/admin/ActivityPage';
import { BehaviourPage } from './pages/admin/BehaviourPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import DeveloperConsolePage from './pages/admin/DeveloperConsolePage';
import { LoginPage as CompanyLoginPage } from './pages/company/LoginPage';
import { LoginPage as BranchLoginPage } from './pages/branch/LoginPage';
import { LoginPage as CustomerLoginPage } from './pages/customer/LoginPage';
import { SignupPage as CustomerSignupPage } from './pages/customer/SignupPage';
import { HomePage as CustomerHomePage } from './pages/customer/HomePage';
import { ExplorePage as CustomerExplorePage } from './pages/customer/ExplorePage';
import { BranchDetailPage as CustomerBranchDetailPage } from './pages/customer/BranchDetailPage';
import { AvailabilityPage as CustomerAvailabilityPage } from './pages/customer/AvailabilityPage';
import { BookingFlowPage as CustomerBookingFlowPage } from './pages/customer/BookingFlowPage';
import { MyBookingsPage as CustomerBookingsPage } from './pages/customer/MyBookingsPage';
import { MembershipsPage as CustomerMembershipsPage } from './pages/customer/MembershipsPage';
import { WalletPage as CustomerWalletPage } from './pages/customer/WalletPage';
import { NotificationsPage as CustomerNotificationsPage } from './pages/customer/NotificationsPage';
import { ProfilePage as CustomerProfilePage } from './pages/customer/ProfilePage';

// const CompanyDashboardPage = () => <div>Company Dashboard</div>;
import { DashboardPage as CompanyDashboardPage } from './pages/company/DashboardPage';
import { BranchesPage as CompanyBranchesPage } from './pages/company/BranchesPage';
import { ServicesPage as CompanyServicesPage } from './pages/company/ServicesPage';
import { MembershipPlansPage as CompanyMembershipPlansPage } from './pages/company/MembershipPlansPage';
import { CampaignsPage as CompanyCampaignsPage } from './pages/company/CampaignsPage';
import { BookingsPage as CompanyBookingsPage } from './pages/company/BookingsPage';
import { PaymentsPage as CompanyPaymentsPage } from './pages/company/PaymentsPage';

// const BranchDashboardPage = () => <div>Branch Dashboard</div>;

import { DashboardPage as BranchDashboardPage } from './pages/branch/DashboardPage';
import { ContactsPage as BranchContactsPage } from "./pages/branch/ContactsPage";
import { CourtsPage as BranchCourtsPage } from "./pages/branch/CourtsPage";

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  {/* Platform Admin Routes */}
                  <Route
                    path="/admin/login"
                    element={<AdminLoginPage />}
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.PLATFORM_SUPER_ADMIN}>
                        <RoleRoute allowedRoles={[USER_ROLES.PLATFORM_SUPER_ADMIN]}>
                          <AdminDashboardPage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/companies"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.PLATFORM_SUPER_ADMIN}>
                        <RoleRoute allowedRoles={[USER_ROLES.PLATFORM_SUPER_ADMIN]}>
                          <AdminCompaniesPage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/companies/:id"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.PLATFORM_SUPER_ADMIN}>
                        <RoleRoute allowedRoles={[USER_ROLES.PLATFORM_SUPER_ADMIN]}>
                          <CompanyDetailPage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/companies/new"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.PLATFORM_SUPER_ADMIN}>
                        <RoleRoute allowedRoles={[USER_ROLES.PLATFORM_SUPER_ADMIN]}>
                          <CompanyFormPage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/companies/:id/edit"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.PLATFORM_SUPER_ADMIN}>
                        <RoleRoute allowedRoles={[USER_ROLES.PLATFORM_SUPER_ADMIN]}>
                          <CompanyFormPage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/activity"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.PLATFORM_SUPER_ADMIN}>
                        <RoleRoute allowedRoles={[USER_ROLES.PLATFORM_SUPER_ADMIN]}>
                          <ActivityPage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/behaviour"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.PLATFORM_SUPER_ADMIN}>
                        <RoleRoute allowedRoles={[USER_ROLES.PLATFORM_SUPER_ADMIN]}>
                          <BehaviourPage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/audit-logs"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.PLATFORM_SUPER_ADMIN}>
                        <RoleRoute allowedRoles={[USER_ROLES.PLATFORM_SUPER_ADMIN]}>
                          <AuditLogsPage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/developer-console/:tableName?"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.PLATFORM_SUPER_ADMIN}>
                        <RoleRoute allowedRoles={[USER_ROLES.PLATFORM_SUPER_ADMIN]}>
                          <DeveloperConsolePage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/profile"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.PLATFORM_SUPER_ADMIN}>
                        <div>Admin Profile</div>
                      </ProtectedRoute>
                    }
                  />

                  {/* Company Admin Routes */}
                  <Route path="/company/login" element={<CompanyLoginPage />} />
                  <Route
                    path="/company/:companyId/dashboard"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.COMPANY_ADMIN}>
                        <CompanyDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/company/:companyId/branches"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.COMPANY_ADMIN}>
                        <CompanyBranchesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/company/:companyId/services"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.COMPANY_ADMIN}>
                        <CompanyServicesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/company/:companyId/membership-plans"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.COMPANY_ADMIN}>
                        <CompanyMembershipPlansPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/company/:companyId/campaigns"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.COMPANY_ADMIN}>
                        <CompanyCampaignsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/company/:companyId/bookings"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.COMPANY_ADMIN}>
                        <CompanyBookingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/company/:companyId/payments"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.COMPANY_ADMIN}>
                        <CompanyPaymentsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/company/:companyId/*"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.COMPANY_ADMIN}>
                        <div>Company Console Pages</div>
                      </ProtectedRoute>
                    }
                  />

                  {/* Branch Routes */}
                  <Route path="/branch/login" element={<BranchLoginPage />} />
                  <Route
                    path="/branch/:companyId/:branchId/dashboard"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={[USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF]}>
                          <BranchDashboardPage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/branch/:companyId/:branchId/contacts"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.BRANCH_MANAGER}>
                        <BranchContactsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/branch/:companyId/:branchId/courts"
                    element={
                      <ProtectedRoute requiredRole={USER_ROLES.BRANCH_MANAGER}>
                        <BranchCourtsPage />
                      </ProtectedRoute>
                    }
                  />
                
            

                  <Route
                    path="/branch/:companyId/:branchId/bookings"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={[USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF]}>
                          <div>Branch Bookings Page</div>
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/branch/:companyId/:branchId/payments"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={[USER_ROLES.BRANCH_MANAGER]}>
                          <div>Branch Payments Page</div>
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />


                  <Route
                    path="/branch/:companyId/:branchId/*"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={[USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF]}>
                          <div>Branch Console Pages</div>
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />

                  {/* Customer Routes */}
                  <Route path="/login" element={<CustomerLoginPage />} />
                  <Route path="/signup" element={<CustomerSignupPage />} />
                  <Route path="/" element={<CustomerHomePage />} />
                  <Route path="/explore" element={<CustomerExplorePage />} />
                  <Route
                    path="/branches/:companyId/:branchId"
                    element={<CustomerBranchDetailPage />}
                  />
                  <Route
                    path="/availability/:companyId/:branchId/:courtId?"
                    element={
                      <ProtectedRoute>
                        <CustomerAvailabilityPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/book/:companyId/:branchId/:courtId?"
                    element={
                      <ProtectedRoute>
                        <CustomerBookingFlowPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-bookings"
                    element={
                      <ProtectedRoute>
                        <CustomerBookingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-bookings/:bookingId"
                    element={
                      <ProtectedRoute>
                        <div>Booking Detail</div>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/memberships"
                    element={
                      <ProtectedRoute>
                        <CustomerMembershipsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/wallet"
                    element={
                      <ProtectedRoute>
                        <CustomerWalletPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <CustomerNotificationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <CustomerProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/companies"
                    element={
                      <ProtectedRoute>
                        <div>Followed Companies</div>
                      </ProtectedRoute>
                    }
                  />

                  {/* Default redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
