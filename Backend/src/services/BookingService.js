const BaseService = require("./BaseService");
const {
  Booking,
  BookingItem,
  BookingParticipant,
  Court,
  Service,
  BookingChangeLog,
} = require("../models");
const { generateUUID } = require("../utils/uuid");
const { ConflictError, NotFoundError } = require("../utils/errors");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

class BookingService extends BaseService {
  constructor() {
    super(Booking);
  }

  async createBooking(data, userId) {
    const { branch_id, items, participants, promo_code } = data;

    const allowedBookingStatuses = [
      "pending",
      "confirmed",
      "cancelled",
      "completed",
      "no_show",
      "expired",
    ];

    const allowedPaymentStatuses = [
      "pending",
      "processing",
      "succeeded",
      "failed",
      "cancelled",
      "refunded",
      "partially_refunded",
    ];

    // UI might send status in many keys (and your UI currently sends "succeeded")
    const firstItem = Array.isArray(items) ? items[0] : null;

    const rawStatus =
      data?.booking_status ??
      data?.status ??
      data?.bookingStatus ??
      firstItem?.booking_status ??
      firstItem?.status ??
      null;

    const normalized = typeof rawStatus === "string" ? rawStatus.trim().toLowerCase() : null;

    // map common UI/payment words to booking_status
    const bookingStatusMap = {
      // payment-ish values -> booking confirmed
      succeeded: "confirmed",
      success: "confirmed",
      paid: "confirmed",
      payment_success: "confirmed",

      // normal values
      confirmed: "confirmed",
      pending: "pending",
      cancelled: "cancelled",
      cancel: "cancelled",
      completed: "completed",
      complete: "completed",
      no_show: "no_show",
      expired: "expired",
    };

    const mappedBookingStatus = normalized ? (bookingStatusMap[normalized] || normalized) : null;

    const bookingStatus =
      mappedBookingStatus && allowedBookingStatuses.includes(mappedBookingStatus)
        ? mappedBookingStatus
        : "pending";

    // if UI sends succeeded, set payment_status too
    const paymentStatusMap = {
      succeeded: "succeeded",
      success: "succeeded",
      paid: "succeeded",
      pending: "pending",
      processing: "processing",
      failed: "failed",
      cancelled: "cancelled",
      refunded: "refunded",
      partially_refunded: "partially_refunded",
    };

    const mappedPaymentStatus = normalized ? (paymentStatusMap[normalized] || null) : null;

    const paymentStatus =
      mappedPaymentStatus && allowedPaymentStatuses.includes(mappedPaymentStatus)
        ? mappedPaymentStatus
        : "pending";

    return sequelize.transaction(async (t) => {
      const bookingNumber = `BK-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      let subtotal = 0;
      let discountAmount = 0;
      let taxAmount = 0;
      let feeAmount = 0;

      const bookingItems = [];

      for (const item of items) {
        const { court_id, service_id, start_datetime, end_datetime } = item;

        const court = await Court.findByPk(court_id, { transaction: t });
        if (!court || court.status !== "active") {
          throw new NotFoundError("Court");
        }

        const existing = await BookingItem.findOne({
          where: {
            court_id,
            deleted_at: { [Op.is]: null },
            [Op.or]: [
              {
                start_datetime: { [Op.lt]: new Date(end_datetime) },
                end_datetime: { [Op.gt]: new Date(start_datetime) },
              },
            ],
          },
          include: [
            {
              model: Booking,
              as: "booking",
              where: {
                booking_status: { [Op.notIn]: ["cancelled", "expired"] },
                deleted_at: { [Op.is]: null },
              },
            },
          ],
          transaction: t,
        });

        if (existing) {
          throw new ConflictError("Court is already booked for this time slot");
        }

        const durationMinutes = Math.round(
          (new Date(end_datetime) - new Date(start_datetime)) / 60000
        );
        const hours = durationMinutes / 60;
        const unitPrice = parseFloat(court.hourly_rate);
        const itemSubtotal = unitPrice * hours;
        subtotal += itemSubtotal;

        bookingItems.push({
          id: generateUUID(),
          booking_id: null,
          company_id: data.company_id,
          branch_id,
          court_id,
          service_id,
          start_datetime: new Date(start_datetime),
          end_datetime: new Date(end_datetime),
          duration_minutes: durationMinutes,
          unit_price: unitPrice,
          quantity: 1,
          subtotal: itemSubtotal,
          discount_amount: 0,
          total_amount: itemSubtotal,
          created_by: userId,
        });
      }

      const totalAmount = subtotal - discountAmount + taxAmount + feeAmount;

      const booking = await Booking.create(
        {
          id: generateUUID(),
          user_id: userId,
          company_id: data.company_id,
          branch_id,
          booking_number: bookingNumber,

          booking_status: bookingStatus,

          booking_source: data.booking_source || "customer_web",
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          fee_amount: feeAmount,
          total_amount: totalAmount,
          currency: "MYR",
          payment_status: paymentStatus,
          notes: data?.notes ?? null,
          created_by: userId,
        },
        { transaction: t }
      );

      for (const item of bookingItems) {
        item.booking_id = booking.id;
        await BookingItem.create(item, { transaction: t });
      }

      if (participants && participants.length > 0) {
        for (const participant of participants) {
          await BookingParticipant.create(
            {
              id: generateUUID(),
              booking_id: booking.id,
              user_id: participant.user_id || null,
              guest_name: participant.guest_name || null,
              guest_email: participant.guest_email || null,
              guest_phone: participant.guest_phone || null,
              is_primary: participant.is_primary || false,
              created_by: userId,
            },
            { transaction: t }
          );
        }
      }

      await BookingChangeLog.create(
        {
          id: generateUUID(),
          booking_id: booking.id,
          change_type: "created",
          changed_by: userId,
          new_value: { status: bookingStatus, payment_status: paymentStatus },
        },
        { transaction: t }
      );

      return await Booking.findByPk(booking.id, {
        include: [
          { model: BookingItem, as: "items" },
          { model: BookingParticipant, as: "participants" },
        ],
        transaction: t,
      });
    });
  }

  async cancelBooking(bookingId, userId, reason) {
    const booking = await this.findById(bookingId);

    if (booking.booking_status === "cancelled") {
      throw new ConflictError("Booking is already cancelled");
    }

    await booking.update({
      booking_status: "cancelled",
      cancelled_at: new Date(),
      cancelled_by: userId,
      cancellation_reason: reason,
    });

    await BookingChangeLog.create({
      id: generateUUID(),
      booking_id: bookingId,
      change_type: "cancelled",
      changed_by: userId,
      old_value: { status: booking.booking_status },
      new_value: { status: "cancelled" },
      reason,
    });

    return booking.reload();
  }
}

module.exports = new BookingService();
