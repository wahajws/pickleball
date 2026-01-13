const BaseService = require("./BaseService");
const { TrainerBooking, Trainer } = require("../models");
const { generateUUID } = require("../utils/uuid");
const { NotFoundError, ConflictError } = require("../utils/errors");
const { Op } = require("sequelize");

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const hoursBetween = (start, end) => {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!s || !e || e <= s) return 0;
  return (e - s) / (1000 * 60 * 60);
};

const normalizeCurrency = (c) => (c ? String(c).toUpperCase() : "USD");

const ALLOWED_STATUS = new Set(["booked", "cancelled", "completed"]);

class TrainerBookingService extends BaseService {
  constructor() {
    super(TrainerBooking);
  }

  // helper: load + validate trainer
  async _getTrainerOrThrow(companyId, trainerId) {
    const trainer = await Trainer.findOne({
      where: {
        id: trainerId,
        company_id: companyId,
        deleted_at: { [Op.is]: null },
      },
    });

    if (!trainer) throw new NotFoundError("Trainer not found");
    if (trainer.status && trainer.status !== "active") {
      throw new ConflictError("Trainer is not active");
    }

    return trainer;
  }

  // helper: avoid overlapping bookings for same trainer
  async _ensureNoOverlap({ companyId, trainerId, start, end, excludeId = null }) {
    const where = {
      company_id: companyId,
      trainer_id: trainerId,
      deleted_at: { [Op.is]: null },
      status: { [Op.in]: ["booked"] }, // only block clashes with active bookings
      // overlap logic: existing.start < newEnd AND existing.end > newStart
      start_datetime: { [Op.lt]: end },
      end_datetime: { [Op.gt]: start },
    };

    if (excludeId) where.id = { [Op.ne]: excludeId };

    const clash = await TrainerBooking.findOne({ where });
    if (clash) throw new ConflictError("Trainer already booked for this time slot");
  }

  async list(companyId, q = {}) {
    const where = {
      company_id: companyId,
      deleted_at: { [Op.is]: null },
    };

    // accept both styles just in case
    const branchId = q.branchId || q.branch_id;
    const trainerId = q.trainerId || q.trainer_id;

    if (branchId) where.branch_id = branchId;
    if (trainerId) where.trainer_id = trainerId;
    if (q.status) where.status = q.status;

    return TrainerBooking.findAll({
      where,
      include: [{ model: Trainer, as: "trainer", required: false }],
      order: [["start_datetime", "DESC"]],
    });
  }

  async create(userId, companyId, data = {}) {
    const branchId = data.branch_id;
    const trainerId = data.trainer_id;

    if (!branchId) throw new ConflictError("branch_id is required");
    if (!trainerId) throw new ConflictError("trainer_id is required");
    if (!data.start_datetime) throw new ConflictError("start_datetime is required");
    if (!data.end_datetime) throw new ConflictError("end_datetime is required");
    if (data.hourly_rate == null) throw new ConflictError("hourly_rate is required");

    const durationHours = hoursBetween(data.start_datetime, data.end_datetime);
    if (durationHours <= 0) throw new ConflictError("end_datetime must be after start_datetime");

    const trainer = await this._getTrainerOrThrow(companyId, trainerId);

    // If trainer is branch-specific, enforce same branch
    if (trainer.branch_id && trainer.branch_id !== branchId) {
      throw new ConflictError("Trainer does not belong to this branch");
    }

    // prevent double booking
    await this._ensureNoOverlap({
      companyId,
      trainerId,
      start: data.start_datetime,
      end: data.end_datetime,
    });

    const hourlyRate = Number(data.hourly_rate);
    if (Number.isNaN(hourlyRate) || hourlyRate < 0) {
      throw new ConflictError("hourly_rate must be a valid number");
    }

    const totalAmount =
      data.total_amount != null
        ? Number(data.total_amount)
        : round2(durationHours * hourlyRate);

    const status = data.status || "booked";
    if (!ALLOWED_STATUS.has(status)) {
      throw new ConflictError("Invalid status");
    }

    return TrainerBooking.create({
      id: generateUUID(),
      company_id: companyId,
      branch_id: branchId,
      trainer_id: trainerId,
      customer_id: data.customer_id || null,

      start_datetime: data.start_datetime,
      end_datetime: data.end_datetime,

      hourly_rate: hourlyRate,
      total_amount: totalAmount,
      currency: normalizeCurrency(data.currency),

      status,

      created_by: userId,
      updated_by: userId,
    });
  }

  async update(userId, companyId, id, data = {}) {
    const booking = await TrainerBooking.findOne({
      where: { id, company_id: companyId, deleted_at: { [Op.is]: null } },
    });
    if (!booking) throw new NotFoundError("Trainer booking not found");

    const patch = { ...data };

    // normalize currency/status if present
    if (patch.currency) patch.currency = normalizeCurrency(patch.currency);
    if (patch.status && !ALLOWED_STATUS.has(patch.status)) {
      throw new ConflictError("Invalid status");
    }

    // if trainer/branch changes, validate trainer constraints
    const nextTrainerId = patch.trainer_id || booking.trainer_id;
    const nextBranchId = patch.branch_id || booking.branch_id;

    if (patch.trainer_id || patch.branch_id) {
      const trainer = await this._getTrainerOrThrow(companyId, nextTrainerId);
      if (trainer.branch_id && trainer.branch_id !== nextBranchId) {
        throw new ConflictError("Trainer does not belong to this branch");
      }
    }

    // determine new time/rate
    const start = patch.start_datetime || booking.start_datetime;
    const end = patch.end_datetime || booking.end_datetime;
    const rate =
      patch.hourly_rate != null ? Number(patch.hourly_rate) : Number(booking.hourly_rate);

    // if time or trainer changes, check overlap
    if (patch.start_datetime || patch.end_datetime || patch.trainer_id) {
      const durationHours = hoursBetween(start, end);
      if (durationHours <= 0) throw new ConflictError("end_datetime must be after start_datetime");

      await this._ensureNoOverlap({
        companyId,
        trainerId: nextTrainerId,
        start,
        end,
        excludeId: booking.id,
      });

      // recompute total unless explicitly provided
      if (patch.total_amount == null) {
        patch.total_amount = round2(durationHours * rate);
      }
    }

    // if rate changes and total not provided, recompute
    if (patch.hourly_rate != null && patch.total_amount == null) {
      const durationHours = hoursBetween(start, end);
      if (durationHours <= 0) throw new ConflictError("end_datetime must be after start_datetime");
      patch.total_amount = round2(durationHours * rate);
    }

    patch.updated_by = userId;

    await booking.update(patch);
    return booking.reload();
  }

  async remove(userId, companyId, id) {
    const booking = await TrainerBooking.findOne({
      where: { id, company_id: companyId, deleted_at: { [Op.is]: null } },
    });
    if (!booking) return null;

    await booking.update({
      status: "cancelled",
      deleted_at: new Date(),
      updated_by: userId,
    });

    return booking.reload();
  }
}

module.exports = new TrainerBookingService();
