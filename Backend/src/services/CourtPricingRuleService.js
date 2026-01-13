const { CourtPricingRule } = require("../models");
const { Op } = require("sequelize");
const { ValidationError, NotFoundError } = require("../utils/errors");

const DAY_MAP = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function normalizeDay(day_of_week) {
  // allow number already
  if (typeof day_of_week === "number") return day_of_week;

  // allow string "MONDAY"
  if (typeof day_of_week === "string") {
    const key = day_of_week.trim().toUpperCase();
    if (key in DAY_MAP) return DAY_MAP[key];

    // allow "1" string
    const n = Number(day_of_week);
    if (!Number.isNaN(n)) return n;
  }

  return null;
}

function validatePayload(body) {
  const errors = [];

  if (!body.branch_id) errors.push({ field: "branch_id", message: "branch_id is required" });
  if (!body.name) errors.push({ field: "name", message: "name is required" });

  const dow = normalizeDay(body.day_of_week);
  if (dow === null || dow < 0 || dow > 6)
    errors.push({ field: "day_of_week", message: "day_of_week must be 0-6 or a day name like MONDAY" });

  if (!body.start_time) errors.push({ field: "start_time", message: "start_time is required" });
  if (!body.end_time) errors.push({ field: "end_time", message: "end_time is required" });

  if (body.price_per_hour === undefined || body.price_per_hour === null || body.price_per_hour === "")
    errors.push({ field: "price_per_hour", message: "price_per_hour is required" });

  if (errors.length) throw new ValidationError("Validation error", errors);

  return { dow };
}

class CourtPricingRuleService {
  static async list(companyId, { branchId = null, courtId = null } = {}) {
    const where = {
      company_id: companyId,
      deleted_at: { [Op.is]: null },
    };

    if (branchId) where.branch_id = branchId;
    if (courtId) where.court_id = courtId;

    const rules = await CourtPricingRule.findAll({
      where,
      order: [["priority", "ASC"], ["created_at", "DESC"]],
    });

    return rules;
  }

  static async create(userId, companyId, body) {
    const { dow } = validatePayload(body);

    const rule = await CourtPricingRule.create({
      company_id: companyId,
      branch_id: body.branch_id,
      court_id: body.court_id || null,

      name: body.name,
      day_of_week: dow,

      start_time: body.start_time,
      end_time: body.end_time,

      price_per_hour: Number(body.price_per_hour),
      currency: (body.currency || "USD").toUpperCase(),

      effective_from: body.effective_from || null,
      effective_to: body.effective_to || null,

      priority: body.priority ?? 10,

      created_by: userId,
      updated_by: userId,
    });

    return rule;
  }

  static async update(userId, companyId, ruleId, body) {
    const rule = await CourtPricingRule.findOne({
      where: { id: ruleId, company_id: companyId, deleted_at: { [Op.is]: null } },
    });
    if (!rule) throw new NotFoundError("Pricing rule not found");

    // if day_of_week is provided, normalize it
    let patch = { ...body };

    if (patch.day_of_week !== undefined) {
      const dow = normalizeDay(patch.day_of_week);
      if (dow === null || dow < 0 || dow > 6) {
        throw new ValidationError("Validation error", [
          { field: "day_of_week", message: "day_of_week must be 0-6 or a day name like MONDAY" },
        ]);
      }
      patch.day_of_week = dow;
    }

    if (patch.price_per_hour !== undefined && patch.price_per_hour !== null && patch.price_per_hour !== "") {
      patch.price_per_hour = Number(patch.price_per_hour);
    }

    patch.updated_by = userId;

    await rule.update(patch);
    return rule;
  }

  static async remove(userId, companyId, ruleId) {
    const rule = await CourtPricingRule.findOne({
      where: { id: ruleId, company_id: companyId, deleted_at: { [Op.is]: null } },
    });
    if (!rule) throw new NotFoundError("Pricing rule not found");

    await rule.update({ deleted_at: new Date(), updated_by: userId });
    return rule;
  }
}

module.exports = CourtPricingRuleService;
