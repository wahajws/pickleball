const { CourtPricingRule } = require("../models");
const { Op } = require("sequelize");

function minutesBetween(a, b) {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

function toTimeStr(d) {
  // HH:MM:SS for MySQL TIME compares
  const dt = new Date(d);
  const hh = String(dt.getHours()).padStart(2,"0");
  const mm = String(dt.getMinutes()).padStart(2,"0");
  return `${hh}:${mm}:00`;
}

class PricingService {
  async priceCourtSlot({ companyId, branchId, courtId, start, end }) {
    const startDt = new Date(start);
    const endDt = new Date(end);

    const dow = startDt.getDay(); // 0..6
    const startTime = toTimeStr(startDt);
    const endTime = toTimeStr(endDt);
    const dateOnly = startDt.toISOString().slice(0,10);

    // rules: prefer court specific over branch-wide
    const rules = await CourtPricingRule.findAll({
      where: {
        company_id: companyId,
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
        day_of_week: dow,
        [Op.or]: [{ court_id: courtId }, { court_id: null }],
        [Op.and]: [
          { start_time: { [Op.lte]: startTime } },
          { end_time: { [Op.gte]: endTime } },
          {
            [Op.or]: [
              { effective_from: null },
              { effective_from: { [Op.lte]: dateOnly } },
            ],
          },
          {
            [Op.or]: [
              { effective_to: null },
              { effective_to: { [Op.gte]: dateOnly } },
            ],
          },
        ],
      },
      order: [
        // court-specific first
        ["court_id", "DESC"],
        ["priority", "ASC"],
      ],
    });

    const rule = rules[0];
    if (!rule) {
      // fallback (avoid crash during demo)
      return { currency: "USD", hourly_rate: 0, total: 0, rule: null };
    }

    const mins = minutesBetween(startDt, endDt);
    const hours = mins / 60;
    const total = Number(rule.price_per_hour) * hours;

    return {
      currency: rule.currency,
      hourly_rate: Number(rule.price_per_hour),
      total: Number(total.toFixed(2)),
      rule,
    };
  }
}

module.exports = new PricingService();
