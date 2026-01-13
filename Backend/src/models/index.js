const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

const User = require("./User")(sequelize, DataTypes);
const Role = require("./Role")(sequelize, DataTypes);
const Permission = require("./Permission")(sequelize, DataTypes);
const RolePermission = require("./RolePermission")(sequelize, DataTypes);
const UserRole = require("./UserRole")(sequelize, DataTypes);

const AuthIdentity = require("./AuthIdentity")(sequelize, DataTypes);
const AuthSession = require("./AuthSession")(sequelize, DataTypes);
const OtpCode = require("./OtpCode")(sequelize, DataTypes);

const CompanyCustomer = require("./CompanyCustomer")(sequelize, DataTypes);

const Company = require("./Company")(sequelize, DataTypes);
const Branch = require("./Branch")(sequelize, DataTypes);
const BranchContact = require("./BranchContact")(sequelize, DataTypes);
const BranchAmenity = require("./BranchAmenity")(sequelize, DataTypes);
const BranchStaff = require("./BranchStaff")(sequelize, DataTypes);
const BranchBusinessHours = require("./BranchBusinessHours")(sequelize, DataTypes);
const BranchSpecialHours = require("./BranchSpecialHours")(sequelize, DataTypes);

const ResourceBlock = require("./ResourceBlock")(sequelize, DataTypes);

const Court = require("./Court")(sequelize, DataTypes);
const CourtFeature = require("./CourtFeature")(sequelize, DataTypes);
const CourtTimeSlot = require("./CourtTimeSlot")(sequelize, DataTypes);

const Booking = require("./Booking")(sequelize, DataTypes);
const BookingItem = require("./BookingItem")(sequelize, DataTypes);
const CourtReservationLock = require("./CourtReservationLock")(sequelize, DataTypes);
const BookingParticipant = require("./BookingParticipant")(sequelize, DataTypes);
const BookingChangeLog = require("./BookingChangeLog")(sequelize, DataTypes);
const BookingWaitlist = require("./BookingWaitlist")(sequelize, DataTypes);

const Group = require("./Group")(sequelize, DataTypes);
const GroupMember = require("./GroupMember")(sequelize, DataTypes);
const GroupBooking = require("./GroupBooking")(sequelize, DataTypes);

const TaxRate = require("./TaxRate")(sequelize, DataTypes);

const Service = require("./Service")(sequelize, DataTypes);
const ServiceBranchAvailability = require("./ServiceBranchAvailability")(sequelize, DataTypes);

const MembershipPlan = require("./MembershipPlan")(sequelize, DataTypes);
const MembershipPlanBenefit = require("./MembershipPlanBenefit")(sequelize, DataTypes);
const CustomerMembership = require("./CustomerMembership")(sequelize, DataTypes);
const MembershipCycle = require("./MembershipCycle")(sequelize, DataTypes);
const MembershipUsageLedger = require("./MembershipUsageLedger")(sequelize, DataTypes);

const Campaign = require("./Campaign")(sequelize, DataTypes);
const CampaignRule = require("./CampaignRule")(sequelize, DataTypes);
const PromoCode = require("./PromoCode")(sequelize, DataTypes);
const DiscountApplication = require("./DiscountApplication")(sequelize, DataTypes);

const Payment = require("./Payment")(sequelize, DataTypes);
const PaymentAttempt = require("./PaymentAttempt")(sequelize, DataTypes);
const Refund = require("./Refund")(sequelize, DataTypes);

const Invoice = require("./Invoice")(sequelize, DataTypes);
const InvoiceItem = require("./InvoiceItem")(sequelize, DataTypes);

const CustomerWalletLedger = require("./CustomerWalletLedger")(sequelize, DataTypes);

const GiftCard = require("./GiftCard")(sequelize, DataTypes);
const GiftCardRedemption = require("./GiftCardRedemption")(sequelize, DataTypes);

const NotificationTemplate = require("./NotificationTemplate")(sequelize, DataTypes);
const NotificationOutbox = require("./NotificationOutbox")(sequelize, DataTypes);
const NotificationDeliveryLog = require("./NotificationDeliveryLog")(sequelize, DataTypes);
const UserNotificationPreference = require("./UserNotificationPreference")(sequelize, DataTypes);

const Review = require("./Review")(sequelize, DataTypes);
const SupportTicket = require("./SupportTicket")(sequelize, DataTypes);
const SupportTicketMessage = require("./SupportTicketMessage")(sequelize, DataTypes);

const AuditLog = require("./AuditLog")(sequelize, DataTypes);

const MediaFile = require("./MediaFile")(sequelize, DataTypes);
const MediaVariant = require("./MediaVariant")(sequelize, DataTypes);

const CourtPricingRule = require("./CourtPricingRule")(sequelize, DataTypes);
const Trainer = require("./Trainer")(sequelize, DataTypes);
const TrainerBooking = require("./TrainerBooking")(sequelize, DataTypes);
const Class = require("./Class")(sequelize, DataTypes);

// you said you already have ClassSession file
const ClassSession = require("./ClassSession")(sequelize, DataTypes);

// -----------------------------
// Define models
// -----------------------------
const models = {
  User,
  Role,
  Permission,
  RolePermission,
  UserRole,

  AuthIdentity,
  AuthSession,
  OtpCode,

  CompanyCustomer,

  Company,
  Branch,
  BranchContact,
  BranchAmenity,
  BranchStaff,
  BranchBusinessHours,
  BranchSpecialHours,

  ResourceBlock,

  Court,
  CourtFeature,
  CourtTimeSlot,

  Booking,
  BookingItem,
  CourtReservationLock,
  BookingParticipant,
  BookingChangeLog,
  BookingWaitlist,

  Group,
  GroupMember,
  GroupBooking,

  TaxRate,

  Service,
  ServiceBranchAvailability,

  MembershipPlan,
  MembershipPlanBenefit,
  CustomerMembership,
  MembershipCycle,
  MembershipUsageLedger,

  Campaign,
  CampaignRule,
  PromoCode,
  DiscountApplication,

  Payment,
  PaymentAttempt,
  Refund,

  Invoice,
  InvoiceItem,

  CustomerWalletLedger,

  GiftCard,
  GiftCardRedemption,

  NotificationTemplate,
  NotificationOutbox,
  NotificationDeliveryLog,
  UserNotificationPreference,

  Review,
  SupportTicket,
  SupportTicketMessage,

  AuditLog,

  MediaFile,
  MediaVariant,

  // ✅ demo/new
  CourtPricingRule,
  Trainer,
  TrainerBooking,
  Class,
  ClassSession,
};

// Load associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName]?.associate) {
    models[modelName].associate(models);
  }
});

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: "actor_user_id", as: "actor" });

module.exports = {
  sequelize,
  ...models,
};
