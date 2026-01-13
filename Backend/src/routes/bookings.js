const express = require("express");
const router = express.Router({ mergeParams: true });

const BookingController = require("../controllers/BookingController");
const { authenticate } = require("../middlewares/auth");
const { validateCompany, requireCompanySubscription } = require("../middlewares/tenant");
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const { isConsoleUser } = require("../utils/isConsoleUser");

// --- Middleware Setup ---
router.use(authenticate);
router.use(validateCompany);

// Bypass company subscription for console users
router.use(async (req, res, next) => {
  try {
    const companyId = req.companyId || req.params.companyId;
    const userId = req.user?.id;

    // Allow console users (platform_super_admin, company_admin, branch_manager, branch_staff)
    if (await isConsoleUser(userId, companyId)) return next();

    // Customer must have active subscription
    return requireCompanySubscription(req, res, next);
  } catch (err) {
    next(err);
  }
});

// --- Validation Rules for Booking Creation ---
const bookingValidation = [
  body("branch_id").notEmpty().withMessage("Branch ID is required"),
  body("items").isArray({ min: 1 }).withMessage("At least one booking item is required"),
  body("items.*.court_id").notEmpty().withMessage("Court ID is required"),
  body("items.*.service_id").notEmpty().withMessage("Service ID is required"),
  body("items.*.start_datetime").isISO8601().withMessage("Start datetime must be valid ISO8601"),
  body("items.*.end_datetime").isISO8601().withMessage("End datetime must be valid ISO8601"),
  validate,
];

// --- Routes ---
router.post("/", bookingValidation, BookingController.create.bind(BookingController));
router.get("/", BookingController.getAll.bind(BookingController));
router.get("/:bookingId", BookingController.getById.bind(BookingController));
router.post(
  "/:bookingId/cancel",
  [body("reason").optional(), validate],
  BookingController.cancel.bind(BookingController)
);

module.exports = router;
