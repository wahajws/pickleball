const express = require("express");
const router = express.Router({ mergeParams: true });

const { Branch, BranchContact } = require("../models");
const { authenticate } = require("../middlewares/auth");
const { validateCompany } = require("../middlewares/tenant");
const { success } = require("../utils/response");
const { NotFoundError } = require("../utils/errors");
const { Op } = require("sequelize");

router.use(authenticate);
router.param("companyId", validateCompany);

// helper: make sure branchId belongs to companyId
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

// GET /api/companies/:companyId/branches/:branchId/contacts
router.get("/", async (req, res, next) => {
  try {
    const { companyId, branchId } = req.params;

    await ensureBranch(companyId, branchId);

    const contacts = await BranchContact.findAll({
      where: {
        branch_id: branchId, // NO company_id here
        deleted_at: { [Op.is]: null },
      },
      order: [["created_at", "DESC"]],
    });

    return success(res, { contacts });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies/:companyId/branches/:branchId/contacts
router.post("/", async (req, res, next) => {
  try {
    const { companyId, branchId } = req.params;

    await ensureBranch(companyId, branchId);

    const contact = await BranchContact.create({
      ...req.body,
      id: req.body.id, // if your table requires uuid and you pass it
      branch_id: branchId,
      created_by: req.userId,
      updated_by: req.userId,
    });

    return success(res, { contact }, "Contact created successfully", 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/companies/:companyId/branches/:branchId/contacts/:contactId
router.patch("/:contactId", async (req, res, next) => {
  try {
    const { companyId, branchId, contactId } = req.params;

    await ensureBranch(companyId, branchId);

    const contact = await BranchContact.findOne({
      where: {
        id: contactId,
        branch_id: branchId, //scope to branch
        deleted_at: { [Op.is]: null },
      },
    });

    if (!contact) throw new NotFoundError("Contact not found");

    await contact.update({
      ...req.body,
      updated_by: req.userId,
    });

    return success(res, { contact }, "Contact updated successfully");
  } catch (err) {
    next(err);
  }
});

// DELETE /api/companies/:companyId/branches/:branchId/contacts/:contactId
router.delete("/:contactId", async (req, res, next) => {
  try {
    const { companyId, branchId, contactId } = req.params;

    await ensureBranch(companyId, branchId);

    const contact = await BranchContact.findOne({
      where: {
        id: contactId,
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
      },
    });

    if (!contact) throw new NotFoundError("Contact not found");

    await contact.update({
      deleted_at: new Date(),
      updated_by: req.userId,
    });

    return success(res, { contact }, "Contact deleted successfully");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
