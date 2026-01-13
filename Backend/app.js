const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const errorHandler = require("./src/middlewares/errorHandler");
const { activityContext } = require("./src/middlewares/activity");

// Core routes
const authRoutes = require("./src/routes/auth");
const sessionsRoutes = require("./src/routes/sessions");
const dashboardRoutes = require("./src/routes/dashboard");

const companiesRoutes = require("./src/routes/companies");
const branchesRoutes = require("./src/routes/branches");

const availabilityRoutes = require("./src/routes/availability");
const bookingsRoutes = require("./src/routes/bookings");
const membershipsRoutes = require("./src/routes/memberships");
const paymentsRoutes = require("./src/routes/payments");
const refundsRoutes = require("./src/routes/refunds");
const invoicesRoutes = require("./src/routes/invoices");
const promoCodesRoutes = require("./src/routes/promo-codes");
const giftCardsRoutes = require("./src/routes/gift-cards");
const reviewsRoutes = require("./src/routes/reviews");
const supportTicketsRoutes = require("./src/routes/support-tickets");

const walletRoutes = require("./src/routes/wallet");
const mediaRoutes = require("./src/routes/media");
const telemetryRoutes = require("./src/routes/telemetry");

// Admin / logs
const adminRoutes = require("./src/routes/admin");
const behaviourRoutes = require("./src/routes/behaviour");

// Branch scoped extra routes
const branchContactsRoutes = require("./src/routes/branch-contacts");
const branchCourtsRoutes = require("./src/routes/branch-courts");

// ✅ Company demo routes (files are inside: src/routes/company/)
const companyCourtsRoutes = require("./src/routes/company/company-courts");
const companyTrainersRoutes = require("./src/routes/company/company-trainers");
const companyClassesRoutes = require("./src/routes/company/company-classes");
const companyTrainerBookingsRoutes = require("./src/routes/company/company-trainer-bookings"); // make sure this file exists
const companyPricingRulesRoutes = require("./src/routes/company/company-pricing-rules"); // if you created it
const companyServicesRoutes = require("./src/routes/company/company-services");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(activityContext);

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);

app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// --------------------
// Dashboard
// --------------------
app.use("/api/dashboard", dashboardRoutes);

// --------------------
// Auth
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/auth/me", sessionsRoutes);

// --------------------
// Companies + Branches
// --------------------
app.use("/api/companies", companiesRoutes);
app.use("/api/companies/:companyId/branches", branchesRoutes);

// --------------------
// Branch scoped routes
// --------------------
app.use(
  "/api/companies/:companyId/branches/:branchId/availability",
  availabilityRoutes
);
app.use(
  "/api/companies/:companyId/branches/:branchId/contacts",
  branchContactsRoutes
);
app.use(
  "/api/companies/:companyId/branches/:branchId/courts",
  branchCourtsRoutes
);

// --------------------
// Company scoped demo routes
// (these help your demo: courts, trainers, classes, trainer bookings, pricing rules)
// --------------------
app.use("/api/companies/:companyId/courts", companyCourtsRoutes);
app.use("/api/companies/:companyId/trainers", companyTrainersRoutes);
app.use("/api/companies/:companyId/classes", companyClassesRoutes);
app.use("/api/companies/:companyId/trainer-bookings", companyTrainerBookingsRoutes);
app.use("/api/companies/:companyId/services", companyServicesRoutes);

app.use(
  "/api/companies/:companyId/pricing-rules",
  companyPricingRulesRoutes
);

// --------------------
// Existing company modules
// --------------------
app.use("/api/companies/:companyId/bookings", bookingsRoutes);
app.use("/api/companies/:companyId/memberships", membershipsRoutes);
app.use("/api/companies/:companyId/payments", paymentsRoutes);
app.use("/api/companies/:companyId/refunds", refundsRoutes);
app.use("/api/companies/:companyId/invoices", invoicesRoutes);
app.use("/api/companies/:companyId/promos", promoCodesRoutes);
app.use("/api/companies/:companyId/gift-cards", giftCardsRoutes);
app.use("/api/companies/:companyId/reviews", reviewsRoutes);
app.use("/api/companies/:companyId/support-tickets", supportTicketsRoutes);

// --------------------
// Me / Media / Telemetry
// --------------------
app.use("/api/me", walletRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/telemetry", telemetryRoutes);

// --------------------
// Admin
// --------------------
app.use("/api/admin", adminRoutes);

// Behaviour (you already had separate file for this)
app.use("/api/admin/behaviour", behaviourRoutes);

// --------------------
// Error handler (last)
// --------------------
app.use(errorHandler);

module.exports = app;
