const express = require("express");
const router = express.Router({ mergeParams: true });

const { authenticate } = require("../../middlewares/auth");
const { validateCompany } = require("../../middlewares/tenant");
const { success } = require("../../utils/response");
const ClassService = require("../../services/ClassService");

router.use(authenticate);
router.param("companyId", validateCompany);

// GET /api/admin/companies/:companyId/classes?branchId=xxx
router.get("/", async (req, res, next) => {
  try {
    const classes = await ClassService.list(req.params.companyId, req.query.branchId);
    return success(res, { classes });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/companies/:companyId/classes
router.post("/", async (req, res, next) => {
  try {
    // branch_id required
    const cls = await ClassService.create(
      req.userId,
      req.params.companyId,
      req.body.branch_id,
      req.body
    );
    return success(res, { class: cls }, "Class created", 201);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/admin/companies/:companyId/classes/:classId
router.patch("/:classId", async (req, res, next) => {
  try {
    const cls = await ClassService.update(
      req.userId,
      req.params.companyId,
      req.params.classId,
      req.body
    );
    return success(res, { class: cls }, "Class updated");
  } catch (e) {
    next(e);
  }
});

// DELETE /api/admin/companies/:companyId/classes/:classId
router.delete("/:classId", async (req, res, next) => {
  try {
    const cls = await ClassService.remove(
      req.userId,
      req.params.companyId,
      req.params.classId
    );
    return success(res, { class: cls }, "Class deleted");
  } catch (e) {
    next(e);
  }
});

module.exports = router;
