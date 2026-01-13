// src/config/api.js

export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export const API_ENDPOINTS = {
  // ---------------------------
  // Auth
  // ---------------------------
  AUTH: {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    OTP_REQUEST: "/auth/otp/request",
    OTP_VERIFY: "/auth/otp/verify",
  },

  // ---------------------------
  // Public / App (non-admin)
  // ---------------------------
  COMPANIES: {
    LIST: "/companies",
    DETAIL: (id) => `/companies/${id}`,
    CREATE: "/companies",
    UPDATE: (id) => `/companies/${id}`,
    DELETE: (id) => `/companies/${id}`,
    SUBSCRIBE: (id) => `/companies/${id}/subscribe`,
    MY_COMPANIES: "/companies/me/companies",
  },

  BRANCHES: {
    LIST: (companyId) => `/companies/${companyId}/branches`,
    DETAIL: (companyId, branchId) =>
      `/companies/${companyId}/branches/${branchId}`,
    CREATE: (companyId) => `/companies/${companyId}/branches`,
    UPDATE: (companyId, branchId) =>
      `/companies/${companyId}/branches/${branchId}`,
    DELETE: (companyId, branchId) =>
      `/companies/${companyId}/branches/${branchId}`,

    CONTACTS: (companyId, branchId) =>
      `/companies/${companyId}/branches/${branchId}/contacts`,
    BUSINESS_HOURS: (companyId, branchId) =>
      `/companies/${companyId}/branches/${branchId}/business-hours`,
  },

  // Courts are branch-scoped in your backend: /companies/:companyId/branches/:branchId/courts
  COURTS: {
    LIST: (companyId, branchId) =>
      `/companies/${companyId}/branches/${branchId}/courts`,
    DETAIL: (companyId, branchId, courtId) =>
      `/companies/${companyId}/branches/${branchId}/courts/${courtId}`,
    CREATE: (companyId, branchId) =>
      `/companies/${companyId}/branches/${branchId}/courts`,
    UPDATE: (companyId, branchId, courtId) =>
      `/companies/${companyId}/branches/${branchId}/courts/${courtId}`,
    DELETE: (companyId, branchId, courtId) =>
      `/companies/${companyId}/branches/${branchId}/courts/${courtId}`,
  },

  BOOKINGS: {
    LIST: (companyId, qs = "") =>
      `/companies/${companyId}/bookings${qs ? `?${qs}` : ""}`,
    DETAIL: (companyId, bookingId) =>
      `/companies/${companyId}/bookings/${bookingId}`,
    CREATE: (companyId) => `/companies/${companyId}/bookings`,
    CANCEL: (companyId, bookingId) =>
      `/companies/${companyId}/bookings/${bookingId}/cancel`,
    RESCHEDULE: (companyId, bookingId) =>
      `/companies/${companyId}/bookings/${bookingId}/reschedule`,
  },

  AVAILABILITY: {
    GET: (companyId, branchId) =>
      `/companies/${companyId}/branches/${branchId}/availability`,
  },

  MEMBERSHIPS: {
    PLANS: (companyId) => `/companies/${companyId}/membership-plans`,
    MY_MEMBERSHIPS: (companyId) => `/companies/${companyId}/memberships`,
    PURCHASE: (companyId) => `/companies/${companyId}/memberships/purchase`,
    CANCEL: (companyId, membershipId) =>
      `/companies/${companyId}/memberships/${membershipId}/cancel`,
  },

  PAYMENTS: {
    INTENT: (companyId) => `/companies/${companyId}/payments/intent`,
    CONFIRM: (companyId) => `/companies/${companyId}/payments/confirm`,
  },

  WALLET: {
    BALANCE: "/me/wallet",
    LEDGER: "/me/wallet/ledger",
  },

  GIFT_CARDS: {
    MY_CARDS: (companyId) =>
      `/companies/${companyId}/gift-cards/me/gift-cards`,
    REDEEM: (companyId) => `/companies/${companyId}/gift-cards/redeem`,
  },

  MEDIA: {
    UPLOAD: "/media",
    GET: (id) => `/media/${id}`,
    DELETE: (id) => `/media/${id}`,
  },

  PROMO_CODES: {
    VALIDATE: (companyId) => `/companies/${companyId}/promos/validate`,
  },

  REVIEWS: {
    LIST: (companyId) => `/companies/${companyId}/reviews`,
    CREATE: (companyId) => `/companies/${companyId}/reviews`,
  },

  SUPPORT_TICKETS: {
    LIST: (companyId) => `/companies/${companyId}/support-tickets`,
    CREATE: (companyId) => `/companies/${companyId}/support-tickets`,
    DETAIL: (companyId, ticketId) =>
      `/companies/${companyId}/support-tickets/${ticketId}`,
  },

  TELEMETRY: "/telemetry",

  // ---------------------------
  // (used by Admin UI tabs, but NOT /admin/*)
  // Mounted in backend as: /api/companies/:companyId/*
  // ---------------------------
  COMPANY_MODULES: {
    TRAINERS: {
      LIST: (companyId, qs = "") =>
        `/companies/${companyId}/trainers${qs ? `?${qs}` : ""}`,
      CREATE: (companyId) => `/companies/${companyId}/trainers`,
      UPDATE: (companyId, trainerId) =>
        `/companies/${companyId}/trainers/${trainerId}`,
      DELETE: (companyId, trainerId) =>
        `/companies/${companyId}/trainers/${trainerId}`,
    },

    CLASSES: {
      LIST: (companyId, qs = "") =>
        `/companies/${companyId}/classes${qs ? `?${qs}` : ""}`,
      CREATE: (companyId) => `/companies/${companyId}/classes`,
      UPDATE: (companyId, classId) =>
        `/companies/${companyId}/classes/${classId}`,
      DELETE: (companyId, classId) =>
        `/companies/${companyId}/classes/${classId}`,
    },

    TRAINER_BOOKINGS: {
      LIST: (companyId, qs = "") =>
        `/companies/${companyId}/trainer-bookings${qs ? `?${qs}` : ""}`,
      CREATE: (companyId) => `/companies/${companyId}/trainer-bookings`,
      UPDATE: (companyId, id) =>
        `/companies/${companyId}/trainer-bookings/${id}`,
      DELETE: (companyId, id) =>
        `/companies/${companyId}/trainer-bookings/${id}`,
    },
  },

  // ---------------------------
  // Admin (optional: keep for existing admin pages)
  // ---------------------------
  ADMIN: {
    // Platform Admin: /api/admin/platform/*
    PLATFORM: {
      COMPANIES: "/admin/platform/companies",
      COMPANY_DETAIL: (id) => `/admin/platform/companies/${id}`,

      BRANCHES: "/admin/platform/branches",
      BRANCH_DETAIL: (id) => `/admin/platform/branches/${id}`,

      COURTS: "/admin/platform/courts",
      COURT_DETAIL: (id) => `/admin/platform/courts/${id}`,

      SERVICES: "/admin/platform/services",
      SERVICE_DETAIL: (id) => `/admin/platform/services/${id}`,

      MEMBERSHIP_PLANS: "/admin/platform/membership-plans",
      MEMBERSHIP_PLAN_DETAIL: (id) =>
        `/admin/platform/membership-plans/${id}`,

      BOOKINGS: "/admin/platform/bookings",
      BOOKING_DETAIL: (id) => `/admin/platform/bookings/${id}`,

      CAMPAIGNS: "/admin/platform/campaigns",
      CAMPAIGN_DETAIL: (id) => `/admin/platform/campaigns/${id}`,

      PROMO_CODES: "/admin/platform/promo-codes",
      PROMO_CODE_DETAIL: (id) => `/admin/platform/promo-codes/${id}`,

      // Your existing admin.js uses /court-rate-rules (keep as-is)
      COURT_RATE_RULES: "/admin/platform/court-rate-rules",
      COURT_RATE_RULE_DETAIL: (id) => `/admin/platform/court-rate-rules/${id}`,

      AUDIT_LOGS: "/admin/platform/audit-logs",
    },

    // Company Admin: /api/admin/companies/:companyId/*
    COMPANY: {
      BRANCHES: (companyId) => `/admin/companies/${companyId}/branches`,
      BRANCH_CONTACTS: (companyId, branchId) =>
        `/admin/companies/${companyId}/branches/${branchId}/contacts`,
      BRANCH_COURTS: (companyId, branchId) =>
        `/admin/companies/${companyId}/branches/${branchId}/courts`,

      SERVICES: (companyId) => `/admin/companies/${companyId}/services`,
      MEMBERSHIP_PLANS: (companyId) =>
        `/admin/companies/${companyId}/membership-plans`,
      CAMPAIGNS: (companyId) => `/admin/companies/${companyId}/campaigns`,
      PROMO_CODES: (companyId) => `/admin/companies/${companyId}/promo-codes`,

      STAFF: (companyId) => `/admin/companies/${companyId}/staff`,
      MEMBERSHIPS: (companyId) => `/admin/companies/${companyId}/memberships`,

      // only if you add them later
      TRAINERS: (companyId) => `/admin/companies/${companyId}/trainers`,
      CLASSES: (companyId) => `/admin/companies/${companyId}/classes`,
    },

    ACTIVITY: "/admin/activity",
    ACTIVITY_EXPORT: "/admin/activity/export",
    BEHAVIOUR: "/admin/behaviour",
    BEHAVIOUR_EXPORT: "/admin/behaviour/export",
  },
};
