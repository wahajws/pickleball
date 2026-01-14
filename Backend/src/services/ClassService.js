// src/services/ClassService.js
const BaseService = require("./BaseService");
const { Class, Trainer, Branch } = require("../models");
const { generateUUID } = require("../utils/uuid");
const { NotFoundError, ConflictError } = require("../utils/errors");
const { Op } = require("sequelize");

const normalizeCurrency = (c) => (c ? String(c).toUpperCase() : "USD");

class ClassService extends BaseService {
  constructor() {
    super(Class);
  }

  async list(companyId, q = {}) {
    const where = {
      company_id: companyId,
      deleted_at: { [Op.is]: null },
    };

    const branchId = q.branchId || q.branch_id;
    const trainerId = q.trainerId || q.trainer_id;

    if (branchId) where.branch_id = branchId;
    if (trainerId) where.trainer_id = trainerId;
    if (q.status) where.status = q.status;

    return Class.findAll({
      where,
      include: [
        { model: Branch, as: "branch", attributes: ["id", "name"], required: false },
        { model: Trainer, as: "trainer", attributes: ["id", "name", "email"], required: false },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  async create(userId, companyId, data = {}) {
    const branchId = data.branch_id || data.branchId;
    const trainerId = data.trainer_id || data.trainerId;

    if (!branchId) throw new ConflictError("branch_id is required");
    if (!trainerId) throw new ConflictError("trainer_id is required");
    if (!data.name) throw new ConflictError("name is required");

    // duration_mins is required in DB (your screenshot)
    const durationMins = data.duration_mins ?? data.durationMins;
    if (durationMins == null || Number.isNaN(Number(durationMins))) {
      throw new ConflictError("duration_mins is required");
    }

    const capacity = data.capacity == null ? 8 : Number(data.capacity);
    const price = data.price == null ? 0 : Number(data.price);

    return Class.create({
      id: generateUUID(),
      company_id: companyId,
      branch_id: branchId,
      trainer_id: trainerId,

      name: String(data.name).trim(),
      description: data.description ? String(data.description).trim() : null,

      duration_mins: Number(durationMins),
      capacity,
      price,
      currency: normalizeCurrency(data.currency),

      status: data.status || "active",

      created_by: userId,
      updated_by: userId,
    });
  }

  async update(userId, companyId, id, data = {}) {
    const cls = await Class.findOne({
      where: { id, company_id: companyId, deleted_at: { [Op.is]: null } },
    });
    if (!cls) throw new NotFoundError("Class not found");

    const patch = { ...data };

    // allow both styles
    if (patch.branchId && !patch.branch_id) patch.branch_id = patch.branchId;
    if (patch.trainerId && !patch.trainer_id) patch.trainer_id = patch.trainerId;
    if (patch.durationMins != null && patch.duration_mins == null) patch.duration_mins = patch.durationMins;

    if (patch.currency) patch.currency = normalizeCurrency(patch.currency);

    patch.updated_by = userId;

    await cls.update(patch);
    return cls.reload({
      include: [
        { model: Branch, as: "branch", attributes: ["id", "name"], required: false },
        { model: Trainer, as: "trainer", attributes: ["id", "name", "email"], required: false },
      ],
    });
  }

  async remove(userId, companyId, id) {
    const cls = await Class.findOne({
      where: { id, company_id: companyId, deleted_at: { [Op.is]: null } },
    });
    if (!cls) throw new NotFoundError("Class not found");

    await cls.update({
      deleted_at: new Date(),
      status: "inactive",
      updated_by: userId,
    });

    return cls.reload();
  }
}

module.exports = new ClassService();
