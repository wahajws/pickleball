const express = require("express");
const router = express.Router({ mergeParams: true });

const { authenticate } = require("../../middlewares/auth");
const { validateCompany, requireCompanySubscription } = require("../../middlewares/tenant");
const { success } = require("../../utils/response");

const { Service } = require("../../models");
const { isConsoleUser } = require("../../utils/isConsoleUser");

// auth
router.use(authenticate);

// sets req.companyId
router.param("companyId", validateCompany);

// ✅ bypass subscription for console users
router.use(async (req, res, next) => {
  try {
    const companyId = req.companyId || req.params.companyId;
    const userId = req.user?.id;

    if (await isConsoleUser(userId, companyId)) return next();

    // customer path -> must be subscribed
    return requireCompanySubscription(req, res, next);
  } catch (e) {
    return next(e);
  }
});

// GET /api/companies/:companyId/services
router.get("/", async (req, res, next) => {
  try {
    const companyId = req.companyId || req.params.companyId;

    const services = await Service.findAll({
      where: {
        company_id: companyId,
        deleted_at: null,
      },
      order: [["created_at", "DESC"]],
    });

    return success(res, { services });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
