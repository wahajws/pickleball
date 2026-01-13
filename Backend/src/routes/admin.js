const express = require('express');
const router = express.Router({ mergeParams: true });

const BaseService = require('../services/BaseService');
const CrudRouterFactory = require('./CrudRouterFactory');

const { authenticate } = require('../middlewares/auth');
const { validateCompany, validateBranch } = require('../middlewares/tenant');
const { requirePlatformAdmin, requireCompanyAdmin } = require('../middlewares/rbac');

const {
  Company, Branch, BranchContact, BranchAmenity, BranchStaff, BranchBusinessHours, BranchSpecialHours,
  Court, CourtFeature, CourtRateRule, CourtTimeSlot, ResourceBlock,
  Service, ServiceBranchAvailability,
  MembershipPlan, MembershipPlanBenefit, CustomerMembership, MembershipCycle, MembershipUsageLedger,
  Campaign, CampaignRule, PromoCode, DiscountApplication,
  Booking, BookingItem, BookingParticipant, BookingChangeLog, BookingWaitlist, CourtReservationLock,
  Payment, PaymentAttempt, Refund, Invoice, InvoiceItem, CustomerWalletLedger,
  GiftCard, GiftCardRedemption,
  NotificationTemplate, NotificationOutbox, NotificationDeliveryLog, UserNotificationPreference,
  Review, SupportTicket, SupportTicketMessage,
  Group, GroupMember, GroupBooking,
  TaxRate, MediaFile, MediaVariant,
  User, Role, Permission, UserRole, RolePermission,
  AuthIdentity, AuthSession, OtpCode, CompanyCustomer
} = require('../models');

// ======================================================
// Platform Admin routes - All tables accessible
// ======================================================
const platformAdminRouter = express.Router();
platformAdminRouter.use(authenticate, requirePlatformAdmin);

// Core Tables
platformAdminRouter.use('/companies', CrudRouterFactory.create(new BaseService(Company), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/users', CrudRouterFactory.create(new BaseService(User), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/roles', CrudRouterFactory.create(new BaseService(Role), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/permissions', CrudRouterFactory.create(new BaseService(Permission), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/user-roles', CrudRouterFactory.create(new BaseService(UserRole), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/role-permissions', CrudRouterFactory.create(new BaseService(RolePermission), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Authentication & Sessions
platformAdminRouter.use('/auth-identities', CrudRouterFactory.create(new BaseService(AuthIdentity), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/auth-sessions', CrudRouterFactory.create(new BaseService(AuthSession), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/otp-codes', CrudRouterFactory.create(new BaseService(OtpCode), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/company-customers', CrudRouterFactory.create(new BaseService(CompanyCustomer), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Branches & Locations
platformAdminRouter.use('/branches', CrudRouterFactory.create(new BaseService(Branch), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/branch-contacts', CrudRouterFactory.create(new BaseService(BranchContact), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/branch-amenities', CrudRouterFactory.create(new BaseService(BranchAmenity), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/branch-staff', CrudRouterFactory.create(new BaseService(BranchStaff), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/branch-business-hours', CrudRouterFactory.create(new BaseService(BranchBusinessHours), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/branch-special-hours', CrudRouterFactory.create(new BaseService(BranchSpecialHours), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Courts & Resources
platformAdminRouter.use('/courts', CrudRouterFactory.create(new BaseService(Court), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/court-features', CrudRouterFactory.create(new BaseService(CourtFeature), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/court-rate-rules', CrudRouterFactory.create(new BaseService(CourtRateRule), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/court-time-slots', CrudRouterFactory.create(new BaseService(CourtTimeSlot), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/resource-blocks', CrudRouterFactory.create(new BaseService(ResourceBlock), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Services
platformAdminRouter.use('/services', CrudRouterFactory.create(new BaseService(Service), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/service-branch-availability', CrudRouterFactory.create(new BaseService(ServiceBranchAvailability), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Memberships
platformAdminRouter.use('/membership-plans', CrudRouterFactory.create(new BaseService(MembershipPlan), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/membership-plan-benefits', CrudRouterFactory.create(new BaseService(MembershipPlanBenefit), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/customer-memberships', CrudRouterFactory.create(new BaseService(CustomerMembership), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/membership-cycles', CrudRouterFactory.create(new BaseService(MembershipCycle), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/membership-usage-ledger', CrudRouterFactory.create(new BaseService(MembershipUsageLedger), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Campaigns & Discounts
platformAdminRouter.use('/campaigns', CrudRouterFactory.create(new BaseService(Campaign), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/campaign-rules', CrudRouterFactory.create(new BaseService(CampaignRule), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/promo-codes', CrudRouterFactory.create(new BaseService(PromoCode), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/discount-applications', CrudRouterFactory.create(new BaseService(DiscountApplication), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Bookings
platformAdminRouter.use('/bookings', CrudRouterFactory.create(new BaseService(Booking), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/booking-items', CrudRouterFactory.create(new BaseService(BookingItem), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/booking-participants', CrudRouterFactory.create(new BaseService(BookingParticipant), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/booking-change-log', CrudRouterFactory.create(new BaseService(BookingChangeLog), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/booking-waitlist', CrudRouterFactory.create(new BaseService(BookingWaitlist), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/court-reservation-locks', CrudRouterFactory.create(new BaseService(CourtReservationLock), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Payments & Financial
platformAdminRouter.use('/payments', CrudRouterFactory.create(new BaseService(Payment), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/payment-attempts', CrudRouterFactory.create(new BaseService(PaymentAttempt), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/refunds', CrudRouterFactory.create(new BaseService(Refund), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/invoices', CrudRouterFactory.create(new BaseService(Invoice), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/invoice-items', CrudRouterFactory.create(new BaseService(InvoiceItem), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/customer-wallet-ledger', CrudRouterFactory.create(new BaseService(CustomerWalletLedger), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/gift-cards', CrudRouterFactory.create(new BaseService(GiftCard), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/gift-card-redemptions', CrudRouterFactory.create(new BaseService(GiftCardRedemption), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Notifications
platformAdminRouter.use('/notification-templates', CrudRouterFactory.create(new BaseService(NotificationTemplate), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/notifications-outbox', CrudRouterFactory.create(new BaseService(NotificationOutbox), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/notification-delivery-logs', CrudRouterFactory.create(new BaseService(NotificationDeliveryLog), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/user-notification-preferences', CrudRouterFactory.create(new BaseService(UserNotificationPreference), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Reviews & Support
platformAdminRouter.use('/reviews', CrudRouterFactory.create(new BaseService(Review), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/support-tickets', CrudRouterFactory.create(new BaseService(SupportTicket), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/support-ticket-messages', CrudRouterFactory.create(new BaseService(SupportTicketMessage), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Groups
platformAdminRouter.use('/groups', CrudRouterFactory.create(new BaseService(Group), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/group-members', CrudRouterFactory.create(new BaseService(GroupMember), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/group-bookings', CrudRouterFactory.create(new BaseService(GroupBooking), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

// Other
platformAdminRouter.use('/tax-rates', CrudRouterFactory.create(new BaseService(TaxRate), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/media-files', CrudRouterFactory.create(new BaseService(MediaFile), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));
platformAdminRouter.use('/media-variants', CrudRouterFactory.create(new BaseService(MediaVariant), {
  requireAuth: true,
  rbac: requirePlatformAdmin
}));

router.use('/platform', platformAdminRouter);

// ======================================================
// NEW: Platform Admin Company Console (for demo tabs)
// URL: /api/admin/companies/:companyId/*
// NOTE: MUST be mounted BEFORE companyAdminRouter to avoid 403
// ======================================================
const companyConsoleRouter = express.Router({ mergeParams: true });
companyConsoleRouter.use(authenticate, validateCompany, requirePlatformAdmin);

// Branches (platform admin)
companyConsoleRouter.use('/branches', CrudRouterFactory.create(new BaseService(Branch), {
  requireAuth: true,
  requireCompany: true,
  rbac: requirePlatformAdmin
}));

// Branch scoped routes for courts
companyConsoleRouter.param('branchId', validateBranch);
companyConsoleRouter.use('/branches/:branchId/courts', CrudRouterFactory.create(new BaseService(Court), {
  requireAuth: true,
  requireCompany: true,
  requireBranch: true,
  rbac: requirePlatformAdmin
}));

// Pricing rules (platform admin)
companyConsoleRouter.use('/pricing-rules', require('./company/company-pricing-rules'));

// Trainers / Classes / Trainer bookings (platform admin)
companyConsoleRouter.use('/trainers', require('./company/company-trainers'));
companyConsoleRouter.use('/classes', require('./company/company-classes'));
companyConsoleRouter.use('/trainer-bookings', require('./company/company-trainer-bookings'));

// IMPORTANT: mount FIRST
router.use('/companies/:companyId', companyConsoleRouter);

// ======================================================
// Company Admin routes (existing)
// ======================================================
const companyAdminRouter = express.Router({ mergeParams: true });
companyAdminRouter.use(authenticate, validateCompany, requireCompanyAdmin);

// Branches CRUD
companyAdminRouter.use('/branches', CrudRouterFactory.create(new BaseService(Branch), {
  requireAuth: true,
  requireCompany: true,
  rbac: requireCompanyAdmin
}));

// Branch Contacts CRUD
companyAdminRouter.param('branchId', validateBranch);
companyAdminRouter.use('/branches/:branchId/contacts', CrudRouterFactory.create(new BaseService(BranchContact), {
  requireAuth: true,
  requireCompany: true,
  requireBranch: true,
  rbac: requireCompanyAdmin
}));

// Courts CRUD
companyAdminRouter.use('/branches/:branchId/courts', CrudRouterFactory.create(new BaseService(Court), {
  requireAuth: true,
  requireCompany: true,
  requireBranch: true,
  rbac: requireCompanyAdmin
}));

// Services CRUD
companyAdminRouter.use('/services', CrudRouterFactory.create(new BaseService(Service), {
  requireAuth: true,
  requireCompany: true,
  rbac: requireCompanyAdmin
}));

// Membership Plans CRUD
companyAdminRouter.use('/membership-plans', CrudRouterFactory.create(new BaseService(MembershipPlan), {
  requireAuth: true,
  requireCompany: true,
  rbac: requireCompanyAdmin
}));

// Membership Plan Benefits CRUD
companyAdminRouter.use('/membership-plans/:planId/benefits', CrudRouterFactory.create(new BaseService(MembershipPlanBenefit), {
  requireAuth: true,
  requireCompany: true,
  rbac: requireCompanyAdmin
}));

// Campaigns CRUD
companyAdminRouter.use('/campaigns', CrudRouterFactory.create(new BaseService(Campaign), {
  requireAuth: true,
  requireCompany: true,
  rbac: requireCompanyAdmin
}));

// Promo Codes CRUD
companyAdminRouter.use('/promo-codes', CrudRouterFactory.create(new BaseService(PromoCode), {
  requireAuth: true,
  requireCompany: true,
  rbac: requireCompanyAdmin
}));

// Notification Templates CRUD
companyAdminRouter.use('/notification-templates', CrudRouterFactory.create(new BaseService(NotificationTemplate), {
  requireAuth: true,
  requireCompany: true,
  rbac: requireCompanyAdmin
}));

// pricing rules (company admin)
companyAdminRouter.use('/pricing-rules', require('./company/company-pricing-rules'));

// mount company admin AFTER company console router
router.use('/companies/:companyId', companyAdminRouter);

// Activity routes
const activityRoutes = require('./activity');
router.use('/activity', activityRoutes);

module.exports = router;
