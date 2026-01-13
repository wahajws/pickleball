const express = require("express");
const router = express.Router({ mergeParams: true });

const { authenticate } = require("../../middlewares/auth");
const { validateCompany } = require("../../middlewares/tenant");
const { success } = require("../../utils/response");
const CourtPricingRuleService = require("../../services/CourtPricingRuleService");

router.use(authenticate);
router.param("companyId", validateCompany);

// GET /api/admin/companies/:companyId/pricing-rules?branchId=...&courtId=...
router.get("/", async (req, res, next) => {
  try {
    const rules = await CourtPricingRuleService.list(req.params.companyId, {
      branchId: req.query.branchId || null,
      courtId: req.query.courtId || null,
    });
    return success(res, { rules });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/companies/:companyId/pricing-rules
router.post("/", async (req, res, next) => {
  try {
    const rule = await CourtPricingRuleService.create(req.userId, req.params.companyId, req.body);
    return success(res, { rule }, "Pricing rule created", 201);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/admin/companies/:companyId/pricing-rules/:ruleId
router.patch("/:ruleId", async (req, res, next) => {
  try {
    const rule = await CourtPricingRuleService.update(
      req.userId,
      req.params.companyId,
      req.params.ruleId,
      req.body
    );
    return success(res, { rule }, "Pricing rule updated");
  } catch (e) {
    next(e);
  }
});

// DELETE /api/admin/companies/:companyId/pricing-rules/:ruleId
router.delete("/:ruleId", async (req, res, next) => {
  try {
    const rule = await CourtPricingRuleService.remove(
      req.userId,
      req.params.companyId,
      req.params.ruleId
    );
    return success(res, { rule }, "Pricing rule deleted");
  } catch (e) {
    next(e);
  }
});

module.exports = router;
