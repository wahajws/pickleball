const BaseService = require('./BaseService');
const { Trainer } = require('../models');
const { generateUUID } = require('../utils/uuid');
const { NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');

class TrainerService extends BaseService {
  constructor() {
    super(Trainer);
  }

  async list(companyId, branchId) {
    const where = { company_id: companyId, deleted_at: { [Op.is]: null } };
    if (branchId) where.branch_id = branchId;

    return Trainer.findAll({ where, order: [['created_at', 'DESC']] });
  }

  async create(userId, companyId, branchId, data = {}) {
    if (!branchId) throw new NotFoundError('branchId is required');

    return Trainer.create({
      id: generateUUID(),
      company_id: companyId,
      branch_id: branchId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      bio: data.bio || null,
      is_active: data.is_active !== false,
      created_by: userId,
      updated_by: userId,
    });
  }

  async update(userId, companyId, trainerId, data = {}) {
    const trainer = await Trainer.findOne({
      where: { id: trainerId, company_id: companyId, deleted_at: { [Op.is]: null } }
    });
    if (!trainer) throw new NotFoundError('Trainer not found');

    await trainer.update({ ...data, updated_by: userId });
    return trainer;
  }

  async remove(userId, companyId, trainerId) {
    const trainer = await Trainer.findOne({
      where: { id: trainerId, company_id: companyId, deleted_at: { [Op.is]: null } }
    });
    if (!trainer) throw new NotFoundError('Trainer not found');

    await trainer.update({ deleted_at: new Date(), is_active: false, updated_by: userId });
    return trainer;
  }
}

module.exports = new TrainerService();
