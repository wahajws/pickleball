const { Court, Branch } = require("../models");
const { generateUUID } = require("../utils/uuid");
const { NotFoundError, ConflictError } = require("../utils/errors");
const { Op } = require("sequelize");

class CourtService {
  async assertBranch(companyId, branchId) {
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

  async list(companyId, branchId) {
    await this.assertBranch(companyId, branchId);

    return Court.findAll({
      where: {
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
        status: { [Op.ne]: "deleted" },
      },
      order: [["created_at", "DESC"]],
    });
  }

  async create(userId, companyId, branchId, data = {}) {
    await this.assertBranch(companyId, branchId);

    if (!data.name) throw new ConflictError("Court name is required");
    if (data.hourly_rate === undefined || data.hourly_rate === null || data.hourly_rate === "")
      throw new ConflictError("hourly_rate is required");

    return Court.create({
      id: generateUUID(),
      branch_id: branchId,
      name: data.name,
      court_number: data.court_number || null,
      court_type: data.court_type || "pickleball",
      surface_type: data.surface_type || null,
      description: data.description || null,
      capacity: Number(data.capacity ?? 4),
      has_lights: !!data.has_lights,
      hourly_rate: Number(data.hourly_rate),
      status: data.status || "active",
      created_by: userId,
      updated_by: userId,
    });
  }

  async update(userId, companyId, branchId, courtId, data = {}) {
    await this.assertBranch(companyId, branchId);

    const court = await Court.findOne({
      where: {
        id: courtId,
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
      },
    });
    if (!court) throw new NotFoundError("Court not found");

    const patch = { ...data, updated_by: userId };

    if (patch.capacity !== undefined) patch.capacity = Number(patch.capacity);
    if (patch.hourly_rate !== undefined) patch.hourly_rate = Number(patch.hourly_rate);
    if (patch.has_lights !== undefined) patch.has_lights = !!patch.has_lights;

    await court.update(patch);
    return court;
  }

  async remove(userId, companyId, branchId, courtId) {
    await this.assertBranch(companyId, branchId);

    const court = await Court.findOne({
      where: { id: courtId, branch_id: branchId, deleted_at: { [Op.is]: null } },
    });
    if (!court) throw new NotFoundError("Court not found");

    await court.update({
      status: "deleted",
      deleted_at: new Date(),
      updated_by: userId,
    });

    return court;
  }
}

module.exports = new CourtService();
