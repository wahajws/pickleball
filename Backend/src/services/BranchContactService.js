const { BranchContact, Branch } = require("../models");
const { generateUUID } = require("../utils/uuid");
const { NotFoundError } = require("../utils/errors");
const { Op } = require("sequelize");

class BranchContactService {
  constructor() {
    this.model = BranchContact;
  }

  // helper: allow only columns that exist in Sequelize model
  pickAllowed(data = {}) {
    const blocked = new Set([
      "id",
      "company_id",
      "branch_id",
      "created_at",
      "updated_at",
      "deleted_at",
      "created_by",
      "updated_by",
    ]);

    const allowedKeys = Object.keys(this.model.rawAttributes || {}).filter((k) => !blocked.has(k));

    const out = {};
    for (const k of allowedKeys) {
      if (data[k] !== undefined) out[k] = data[k];
    }
    return out;
  }

  async ensureBranch(companyId, branchId) {
    const branch = await Branch.findOne({
      where: {
        id: branchId,
        company_id: companyId,
        deleted_at: { [Op.is]: null },
      },
    });
    if (!branch) throw new NotFoundError("Branch not found");
    return branch;
  }

  async list(companyId, branchId) {
    await this.ensureBranch(companyId, branchId);

    return BranchContact.findAll({
      where: {
        company_id: companyId,
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
      },
      order: [["created_at", "DESC"]],
    });
  }

  async create(userId, companyId, branchId, data = {}) {
    await this.ensureBranch(companyId, branchId);

    const payload = this.pickAllowed(data);

    return BranchContact.create({
      id: generateUUID(),
      company_id: companyId,
      branch_id: branchId,

      ...payload,

      created_by: userId,
      updated_by: userId,
    });
  }

  async update(userId, companyId, branchId, contactId, data = {}) {
    await this.ensureBranch(companyId, branchId);

    const contact = await BranchContact.findOne({
      where: {
        id: contactId,
        company_id: companyId,
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
      },
    });
    if (!contact) throw new NotFoundError("Contact not found");

    const patch = this.pickAllowed(data);
    patch.updated_by = userId;

    await contact.update(patch);
    return contact;
  }

  async remove(userId, companyId, branchId, contactId) {
    await this.ensureBranch(companyId, branchId);

    const contact = await BranchContact.findOne({
      where: {
        id: contactId,
        company_id: companyId,
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
      },
    });
    if (!contact) throw new NotFoundError("Contact not found");

    const soft = { deleted_at: new Date(), updated_by: userId };

    // if your model has is_active/status, also set it
    if (this.model.rawAttributes?.is_active) soft.is_active = false;
    if (this.model.rawAttributes?.status) soft.status = "deleted";

    await contact.update(soft);
    return contact;
  }
}

module.exports = new BranchContactService();
