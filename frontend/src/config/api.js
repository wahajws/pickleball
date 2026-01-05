export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    OTP_REQUEST: '/auth/otp/request',
    OTP_VERIFY: '/auth/otp/verify',
  },
  // Companies
  COMPANIES: {
    LIST: '/companies',
    DETAIL: (id) => `/companies/${id}`,
    CREATE: '/companies',
    UPDATE: (id) => `/companies/${id}`,
    DELETE: (id) => `/companies/${id}`,
    SUBSCRIBE: (id) => `/companies/${id}/subscribe`,
    MY_COMPANIES: '/companies/me/companies',
  },
  // Branches
  BRANCHES: {
    LIST: (companyId) => `/companies/${companyId}/branches`,
    DETAIL: (companyId, branchId) => `/companies/${companyId}/branches/${branchId}`,
    CREATE: (companyId) => `/companies/${companyId}/branches`,
    UPDATE: (companyId, branchId) => `/companies/${companyId}/branches/${branchId}`,
    DELETE: (companyId, branchId) => `/companies/${companyId}/branches/${branchId}`,
    CONTACTS: (companyId, branchId) => `/companies/${companyId}/branches/${branchId}/contacts`,
    BUSINESS_HOURS: (companyId, branchId) => `/companies/${companyId}/branches/${branchId}/business-hours`,
  },
  // Courts
  COURTS: {
    LIST: (companyId, branchId) => `/companies/${companyId}/branches/${branchId}/courts`,
    DETAIL: (companyId, branchId, courtId) => `/companies/${companyId}/branches/${branchId}/courts/${courtId}`,
    CREATE: (companyId, branchId) => `/companies/${companyId}/branches/${branchId}/courts`,
    UPDATE: (companyId, branchId, courtId) => `/companies/${companyId}/branches/${branchId}/courts/${courtId}`,
    DELETE: (companyId, branchId, courtId) => `/companies/${companyId}/branches/${branchId}/courts/${courtId}`,
  },
  // Bookings
  BOOKINGS: {
    LIST: (companyId) => `/companies/${companyId}/bookings`,
    DETAIL: (companyId, bookingId) => `/companies/${companyId}/bookings/${bookingId}`,
    CREATE: (companyId) => `/companies/${companyId}/bookings`,
    CANCEL: (companyId, bookingId) => `/companies/${companyId}/bookings/${bookingId}/cancel`,
    RESCHEDULE: (companyId, bookingId) => `/companies/${companyId}/bookings/${bookingId}/reschedule`,
  },
  // Availability
  AVAILABILITY: {
    GET: (companyId, branchId) => `/companies/${companyId}/branches/${branchId}/availability`,
  },
  // Memberships
  MEMBERSHIPS: {
    PLANS: (companyId) => `/companies/${companyId}/membership-plans`,
    MY_MEMBERSHIPS: (companyId) => `/companies/${companyId}/memberships`,
    PURCHASE: (companyId) => `/companies/${companyId}/memberships`,
    CANCEL: (companyId, membershipId) => `/companies/${companyId}/memberships/${membershipId}/cancel`,
  },
  // Payments
  PAYMENTS: {
    INTENT: (companyId) => `/companies/${companyId}/payments/intent`,
    CONFIRM: (companyId) => `/companies/${companyId}/payments/confirm`,
  },
  // Wallet
  WALLET: {
    BALANCE: '/me/wallet',
    LEDGER: '/me/wallet/ledger',
  },
  // Gift Cards
  GIFT_CARDS: {
    MY_CARDS: (companyId) => `/companies/${companyId}/gift-cards/me/gift-cards`,
    REDEEM: (companyId) => `/companies/${companyId}/gift-cards/redeem`,
  },
  // Media
  MEDIA: {
    UPLOAD: '/media',
    GET: (id) => `/media/${id}`,
    DELETE: (id) => `/media/${id}`,
  },
  // Promo Codes
  PROMO_CODES: {
    VALIDATE: (companyId) => `/companies/${companyId}/promos/validate`,
  },
  // Reviews
  REVIEWS: {
    LIST: (companyId) => `/companies/${companyId}/reviews`,
    CREATE: (companyId) => `/companies/${companyId}/reviews`,
  },
  // Support Tickets
  SUPPORT_TICKETS: {
    LIST: (companyId) => `/companies/${companyId}/support-tickets`,
    CREATE: (companyId) => `/companies/${companyId}/support-tickets`,
    DETAIL: (companyId, ticketId) => `/companies/${companyId}/support-tickets/${ticketId}`,
  },
  // Telemetry
  TELEMETRY: '/telemetry',
  // Admin
  ADMIN: {
    PLATFORM: {
      COMPANIES: '/admin/platform/companies',
      COMPANY_DETAIL: (id) => `/admin/platform/companies/${id}`,
      AUDIT_LOGS: '/admin/platform/audit-logs',
      ACTIVITY: '/admin/activity',
      ACTIVITY_EXPORT: '/admin/activity/export',
      BEHAVIOUR: '/admin/behaviour',
      BEHAVIOUR_EXPORT: '/admin/behaviour/export',
    },
    COMPANY: {
      BRANCHES: (companyId) => `/admin/companies/${companyId}/branches`,
      COURTS: (companyId, branchId) => `/admin/companies/${companyId}/branches/${branchId}/courts`,
      SERVICES: (companyId) => `/admin/companies/${companyId}/services`,
      MEMBERSHIP_PLANS: (companyId) => `/admin/companies/${companyId}/membership-plans`,
      CAMPAIGNS: (companyId) => `/admin/companies/${companyId}/campaigns`,
      PROMO_CODES: (companyId) => `/admin/companies/${companyId}/promo-codes`,
      STAFF: (companyId) => `/admin/companies/${companyId}/staff`,
    },
  },
};

