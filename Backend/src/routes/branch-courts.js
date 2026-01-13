const express = require("express");
const router = express.Router({ mergeParams: true });

const { Branch, Court } = require("../models");
const { authenticate } = require("../middlewares/auth");
const { validateCompany } = require("../middlewares/tenant");
const { success } = require("../utils/response");
const { NotFoundError } = require("../utils/errors");
const { Op } = require("sequelize");

router.use(authenticate);
router.param("companyId", validateCompany);

async function ensureBranch(companyId, branchId) {
  const branch = await Branch.findOne({
    where: {
      id: branchId,
      company_id: companyId,
      deleted_at: { [Op.is]: null },
    },
  });
  if (!branch) throw new NotFoundError("Branch not found for this company");
  return branch;
}

// GET /api/companies/:companyId/branches/:branchId/courts
router.get("/", async (req, res, next) => {
  try {
    const { companyId, branchId } = req.params;

    await ensureBranch(companyId, branchId);

    const courts = await Court.findAll({
      where: {
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
      },
      order: [["created_at", "DESC"]],
    });

    return success(res, { courts });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:companyId/branches/:branchId/courts
router.post("/", async (req, res, next) => {
  try {
    const { companyId, branchId } = req.params;

    await ensureBranch(companyId, branchId);

    // ✅ ignore any id/branch_id coming from client
    const { id, branch_id, created_by, updated_by, ...safeBody } = req.body || {};

    const court = await Court.create({
      ...safeBody,
      branch_id: branchId,
      created_by: req.userId,
      updated_by: req.userId,
    });

    return success(res, { court }, "Court created successfully", 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/companies/:companyId/branches/:branchId/courts/:courtId
router.patch("/:courtId", async (req, res, next) => {
  try {
    const { companyId, branchId, courtId } = req.params;

    await ensureBranch(companyId, branchId);

    const court = await Court.findOne({
      where: {
        id: courtId,
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
      },
    });
    if (!court) throw new NotFoundError("Court not found");

    // ✅ ignore id/branch_id from client on update too
    const { id, branch_id, created_by, ...safeBody } = req.body || {};

    await court.update({
      ...safeBody,
      updated_by: req.userId,
    });

    return success(res, { court }, "Court updated successfully");
  } catch (err) {
    next(err);
  }
});

// DELETE /api/companies/:companyId/branches/:branchId/courts/:courtId
router.delete("/:courtId", async (req, res, next) => {
  try {
    const { companyId, branchId, courtId } = req.params;

    await ensureBranch(companyId, branchId);

    const court = await Court.findOne({
      where: {
        id: courtId,
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
      },
    });
    if (!court) throw new NotFoundError("Court not found");

    await court.update({
      deleted_at: new Date(),
      updated_by: req.userId,
    });

    return success(res, { court }, "Court deleted successfully");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
