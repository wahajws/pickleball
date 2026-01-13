const express = require("express");
const router = express.Router({ mergeParams: true });

const { Booking } = require("../models");
const { success } = require("../utils/response");
const { Op } = require("sequelize");

router.get("/", async (req, res, next) => {
  try {
    const { companyId, branchId } = req.params;

    const bookings = await Booking.findAll({
      where: {
        company_id: companyId,
        branch_id: branchId,
        deleted_at: { [Op.is]: null },
      },
      order: [["created_at", "DESC"]],
    });

    return success(res, { bookings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
