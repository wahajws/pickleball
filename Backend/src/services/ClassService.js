const BaseService = require("./BaseService");
const { Class, Trainer } = require("../models");
const { generateUUID } = require("../utils/uuid");
const { NotFoundError } = require("../utils/errors");
const { Op } = require("sequelize");

class ClassService extends BaseService {
  constructor() {
    super(Class);
  }

  async list(companyId, branchId = null) {
    const where = {
      company_id: companyId,
      deleted_at: { [Op.is]: null },
    };

    if (branchId) where.branch_id = branchId;

    return Class.findAll({
      where,
      include: [{ model: Trainer, as: "trainer" }],
      order: [["created_at", "DESC"]],
    });
  }

  async create(userId, companyId, branchId, data = {}) {
    // optional validation: trainer must exist
    // (skip for now if you want super fast demo)

    return Class.create({
      id: generateUUID(),
      company_id: companyId,
      branch_id: branchId,
      trainer_id: data.trainer_id,

      name: data.name,
      description: data.description || null,
      capacity: data.capacity ?? 8,
      price: data.price ?? 0,
      currency: data.currency || "USD",

      status: data.status || "active",
      created_by: userId,
      updated_by: userId,
    });
  }

  async update(userId, companyId, classId, data = {}) {
    const cls = await Class.findOne({
      where: {
        id: classId,
        company_id: companyId,
        deleted_at: { [Op.is]: null },
      },
    });

    if (!cls) throw new NotFoundError("Class not found");

    await cls.update({
      ...data,
      updated_by: userId,
    });

    return cls;
  }

  async remove(userId, companyId, classId) {
    const cls = await Class.findOne({
      where: {
        id: classId,
        company_id: companyId,
        deleted_at: { [Op.is]: null },
      },
    });

    if (!cls) throw new NotFoundError("Class not found");

    await cls.update({
      status: "deleted",
      deleted_at: new Date(),
      updated_by: userId,
    });

    return cls;
  }
}

module.exports = new ClassService();
