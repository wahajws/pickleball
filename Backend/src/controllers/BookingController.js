const BookingService = require("../services/BookingService");
const { success, paginated } = require("../utils/response");
const { BookingItem, Court, Service, BookingParticipant } = require("../models");
const { logActivity } = require("../middlewares/activity");
const Telemetry = require("../utils/telemetry");
const { Op } = require("sequelize");

class BookingController {
  async create(req, res, next) {
    try {
      const companyId = req.params.companyId;

      const booking = await BookingService.createBooking(
        {
          ...req.body,
          company_id: companyId,
        },
        req.userId
      );

      // court_id is inside items[0] normally
      const firstItem = Array.isArray(req.body?.items) ? req.body.items[0] : null;

      await logActivity(req, {
        action: "booking_created",
        entity_type: "booking",
        entity_id: booking.id,
        metadata: {
          branch_id: booking.branch_id,
          court_id: firstItem?.court_id || null,
          service_id: firstItem?.service_id || null,
        },
      });

      await Telemetry.track(req, {
        event_name: "booking.confirmed",
        company_id: companyId,
        branch_id: booking.branch_id,
        entity_type: "booking",
        entity_id: booking.id,
        properties: {
          court_id: firstItem?.court_id || null,
          service_id: firstItem?.service_id || null,
          status: booking.booking_status || null,
        },
      });

      return success(res, { booking }, "Booking created successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 10, branchId, status, from, to } = req.query;

      const where = { company_id: req.companyId };

      // If not console role -> only own bookings
      const roleNames = Array.isArray(req.roleNames) ? req.roleNames : [];
      const isConsole = roleNames.some((r) =>
        ["platform_super_admin", "company_admin", "branch_manager", "staff"].includes(r)
      );

      if (!isConsole) {
        where.user_id = req.userId;
      }

      if (branchId) where.branch_id = branchId;

      // ✅ FIX: DB column is booking_status (NOT status)
      if (status) where.booking_status = status;

      // ✅ FIX: use Sequelize Op for date filters (and use created_at as you wanted)
      if (from || to) {
        where.created_at = {};
        if (from) where.created_at[Op.gte] = new Date(from);
        if (to) where.created_at[Op.lte] = new Date(to);
      }

      const result = await BookingService.paginate(parseInt(page), parseInt(pageSize), {
        where,
        include: [
          {
            model: BookingItem,
            as: "items",
            include: [
              { model: Court, as: "court", attributes: ["id", "name"] },
              { model: Service, as: "service", attributes: ["id", "name"] },
            ],
          },
          { model: BookingParticipant, as: "participants" },
        ],
        // optional: latest first
        order: [["created_at", "DESC"]],
      });

      return paginated(res, result.data, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const booking = await BookingService.findById(req.params.bookingId, {
        include: [
          {
            model: BookingItem,
            as: "items",
            include: [
              { model: Court, as: "court", attributes: ["id", "name"] },
              { model: Service, as: "service", attributes: ["id", "name"] },
            ],
          },
          { model: BookingParticipant, as: "participants" },
        ],
      });

      return success(res, { booking });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const companyId = req.params.companyId;

      const booking = await BookingService.cancelBooking(
        req.params.bookingId,
        req.userId,
        req.body.reason
      );

      await logActivity(req, {
        action: "booking_cancelled",
        entity_type: "booking",
        entity_id: booking.id,
        metadata: { reason: req.body.reason },
      });

      await Telemetry.track(req, {
        event_name: "booking.cancelled",
        company_id: companyId,
        branch_id: booking.branch_id,
        entity_type: "booking",
        entity_id: booking.id,
        properties: { reason: req.body.reason },
      });

      return success(res, { booking }, "Booking cancelled successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();
