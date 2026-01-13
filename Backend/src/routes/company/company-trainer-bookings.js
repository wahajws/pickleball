const express = require("express");
const router = express.Router({ mergeParams: true });

const { authenticate } = require("../../middlewares/auth");
const { validateCompany } = require("../../middlewares/tenant");
const { requirePlatformAdmin, requireCompanyAdmin } = require("../../middlewares/rbac");

const { success } = require("../../utils/response");
const validate = require("../../middlewares/validate");

const TrainerBookingService = require("../../services/TrainerBookingService");

const { body, query, param } = require("express-validator");

// Allow Platform Admin OR Company Admin
const allowPlatformOrCompanyAdmin = (req, res, next) => {
  // try platform admin first
  requirePlatformAdmin(req, res, (err) => {
    if (!err) return next(); // platform admin ok
    // else fallback to company admin
    return requireCompanyAdmin(req, res, next);
  });
};

router.use(authenticate);
router.param("companyId", validateCompany);
router.use(allowPlatformOrCompanyAdmin);

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
      const trainer_bookings = await TrainerBookingService.list(
        req.params.companyId,
        req.query
      );
      return success(res, { trainer_bookings });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * POST /api/companies/:companyId/trainer-bookings
 * Required for demo: branch_id, trainer_id, start_datetime, end_datetime, hourly_rate
 * customer_id optional (admin can create without customer)
 */
router.post(
  "/",
  [
    body("branch_id").notEmpty().isUUID().withMessage("branch_id is required (UUID)"),
    body("trainer_id").notEmpty().isUUID().withMessage("trainer_id is required (UUID)"),
    body("customer_id").optional().isUUID().withMessage("customer_id must be UUID"),

    body("start_datetime").notEmpty().isISO8601().withMessage("start_datetime must be ISO8601"),
    body("end_datetime").notEmpty().isISO8601().withMessage("end_datetime must be ISO8601"),

    body("hourly_rate")
      .notEmpty()
      .isDecimal()
      .withMessage("hourly_rate is required (decimal)"),

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
      const trainer_booking = await TrainerBookingService.create(
        req.userId,
        req.params.companyId,
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
      const trainer_booking = await TrainerBookingService.update(
        req.userId,
        req.params.companyId,
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
 * (Service should soft-delete using deleted_at if you want)
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("id must be UUID"), validate],
  async (req, res, next) => {
    try {
      const trainer_booking = await TrainerBookingService.remove(
        req.userId,
        req.params.companyId,
        req.params.id
      );
      return success(res, { trainer_booking }, "Trainer booking deleted");
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
