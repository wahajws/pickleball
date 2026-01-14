// Backend/src/routes/company/trainer-bookings.js
const express = require("express");
const router = express.Router({ mergeParams: true });

const { authenticate } = require("../../middlewares/auth");
const { validateCompany, requireCompanySubscription } = require("../../middlewares/tenant");
const { success } = require("../../utils/response");
const validate = require("../../middlewares/validate");

const { body, query, param } = require("express-validator");

const TrainerBookingService = require("../../services/TrainerBookingService");
const { isConsoleUser } = require("../../utils/isConsoleUser");

// auth
router.use(authenticate);

// sets req.companyId
router.param("companyId", validateCompany);

// ✅ bypass subscription + permission checks for console users
router.use(async (req, res, next) => {
  try {
    const companyId = req.companyId || req.params.companyId;
    const userId = req.user?.id;

    // console user -> bypass
    if (await isConsoleUser(userId, companyId)) return next();

    // non-console (customer) -> must be subscribed
    return requireCompanySubscription(req, res, next);
  } catch (e) {
    return next(e);
  }
});

/**
 * GET /api/companies/:companyId/trainer-bookings?branchId=&trainerId=&status=
 */
router.get(
  "/",
  [
    query("branchId").optional().isUUID().withMessage("branchId must be UUID"),
    query("trainerId").optional().isUUID().withMessage("trainerId must be UUID"),
    query("status")
      .optional()
      .isIn(["booked", "cancelled", "completed"])
      .withMessage("status must be booked/cancelled/completed"),
    validate,
  ],
  async (req, res, next) => {
    try {
      const companyId = req.companyId || req.params.companyId;

      const trainer_bookings = await TrainerBookingService.list(companyId, req.query);

      return success(res, { trainer_bookings });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * POST /api/companies/:companyId/trainer-bookings
 */
router.post(
  "/",
  [
    body("branch_id").notEmpty().isUUID().withMessage("branch_id is required (UUID)"),
    body("trainer_id").notEmpty().isUUID().withMessage("trainer_id is required (UUID)"),
    body("customer_id").optional().isUUID().withMessage("customer_id must be UUID"),

    body("start_datetime").notEmpty().isISO8601().withMessage("start_datetime must be ISO8601"),
    body("end_datetime").notEmpty().isISO8601().withMessage("end_datetime must be ISO8601"),

    body("hourly_rate").notEmpty().isDecimal().withMessage("hourly_rate is required (decimal)"),

    body("currency")
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage("currency must be 3 letters (e.g., USD)"),

    body("status")
      .optional()
      .isIn(["booked", "cancelled", "completed"])
      .withMessage("status must be booked/cancelled/completed"),

    validate,
  ],
  async (req, res, next) => {
    try {
      const companyId = req.companyId || req.params.companyId;

      const trainer_booking = await TrainerBookingService.create(
        req.userId,
        companyId,
        req.body
      );

      return success(res, { trainer_booking }, "Trainer booking created", 201);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * PATCH /api/companies/:companyId/trainer-bookings/:id
 */
router.patch(
  "/:id",
  [
    param("id").isUUID().withMessage("id must be UUID"),

    body("start_datetime").optional().isISO8601(),
    body("end_datetime").optional().isISO8601(),
    body("hourly_rate").optional().isDecimal(),
    body("currency").optional().isLength({ min: 3, max: 3 }),

    body("status").optional().isIn(["booked", "cancelled", "completed"]),

    validate,
  ],
  async (req, res, next) => {
    try {
      const companyId = req.companyId || req.params.companyId;

      const trainer_booking = await TrainerBookingService.update(
        req.userId,
        companyId,
        req.params.id,
        req.body
      );

      return success(res, { trainer_booking }, "Trainer booking updated");
    } catch (e) {
      next(e);
    }
  }
);

/**
 * DELETE /api/companies/:companyId/trainer-bookings/:id
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("id must be UUID"), validate],
  async (req, res, next) => {
    try {
      const companyId = req.companyId || req.params.companyId;

      const trainer_booking = await TrainerBookingService.remove(
        req.userId,
        companyId,
        req.params.id
      );

      return success(res, { trainer_booking }, "Trainer booking deleted");
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
