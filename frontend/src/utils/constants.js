export const USER_ROLES = {
  PLATFORM_SUPER_ADMIN: 'platform_super_admin',
  COMPANY_ADMIN: 'company_admin',
  BRANCH_MANAGER: 'branch_manager',
  STAFF: 'staff',
  CUSTOMER: 'customer',
};

export const ROUTES = {
  // Platform Admin
  ADMIN: {
    LOGIN: '/admin/login',
    DASHBOARD: '/admin/dashboard',
    COMPANIES: '/admin/companies',
    COMPANY_DETAIL: (id) => `/admin/companies/${id}`,
    ACTIVITY: '/admin/activity',
    BEHAVIOUR: '/admin/behaviour',
    AUDIT_LOGS: '/admin/audit-logs',
    DEVELOPER_CONSOLE: '/admin/developer-console',
    PROFILE: '/admin/profile',
  },
  // Company Admin
  COMPANY: {
    LOGIN: '/company/login',
    DASHBOARD: (companyId) => `/company/${companyId}/dashboard`,
    PROFILE: (companyId) => `/company/${companyId}/profile`,
    BRANCHES: (companyId) => `/company/${companyId}/branches`,
    BRANCH_DETAIL: (companyId, branchId) => `/company/${companyId}/branches/${branchId}`,
    COURTS: (companyId, branchId) => `/company/${companyId}/branches/${branchId}/courts`,
    SERVICES: (companyId) => `/company/${companyId}/services`,
    MEMBERSHIP_PLANS: (companyId) => `/company/${companyId}/membership-plans`,
    CAMPAIGNS: (companyId) => `/company/${companyId}/campaigns`,
    BOOKINGS: (companyId) => `/company/${companyId}/bookings`,
    PAYMENTS: (companyId) => `/company/${companyId}/payments`,
    MEDIA: (companyId) => `/company/${companyId}/media`,
    STAFF: (companyId) => `/company/${companyId}/staff`,
  },
  COMPANY_TRAINERS: {
    LIST: (companyId) => `/companies/${companyId}/trainers`,
  },

  COMPANY_CLASSES: {
    LIST: (companyId) => `/companies/${companyId}/classes`, // use ?branchId=
    CREATE: (companyId) => `/companies/${companyId}/classes`,
    UPDATE: (companyId, classId) => `/companies/${companyId}/classes/${classId}`,
    DELETE: (companyId, classId) => `/companies/${companyId}/classes/${classId}`,
  },
  // Branch Manager/Staff
  BRANCH: {
    LOGIN: '/branch/login',
    DASHBOARD: (companyId, branchId) => `/branch/${companyId}/${branchId}/dashboard`,
    PROFILE: (companyId, branchId) => `/branch/${companyId}/${branchId}/profile`,
    CONTACTS: (companyId, branchId) => `/branch/${companyId}/${branchId}/contacts`,
    COURTS: (companyId, branchId) => `/branch/${companyId}/${branchId}/courts`,
    BUSINESS_HOURS: (companyId, branchId) => `/branch/${companyId}/${branchId}/business-hours`,
    BOOKINGS: (companyId, branchId) => `/branch/${companyId}/${branchId}/bookings`,
    MEDIA: (companyId, branchId) => `/branch/${companyId}/${branchId}/media`,
    PAYMENTS: (companyId, branchId) => `/branch/${companyId}/${branchId}/payments`,
    STAFF: (companyId, branchId) => `/branch/${companyId}/${branchId}/staff`,
  },
  // Customer
  CUSTOMER: {
    HOME: '/',
    EXPLORE: '/explore',
    LOGIN: '/login',
    SIGNUP: '/signup',
    BRANCHES: '/branches',
    BRANCH_DETAIL: (companyId, branchId) => `/branches/${companyId}/${branchId}`,
    BOOKINGS: '/my-bookings',
    BOOKING_DETAIL: (bookingId) => `/my-bookings/${bookingId}`,
    BOOKING_FLOW: (companyId, branchId, courtId) => `/book/${companyId}/${branchId}${courtId ? `/${courtId}` : ''}`,
    AVAILABILITY: (companyId, branchId) => `/availability/${companyId}/${branchId}`,
    MEMBERSHIPS: '/memberships',
    GIFT_CARDS: '/gift-cards',
    WALLET: '/wallet',
    PROFILE: '/profile',
    NOTIFICATIONS: '/notifications',
    COMPANIES: '/companies',
  },
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

