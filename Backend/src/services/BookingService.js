const BaseService = require('./BaseService');
const { Booking, BookingItem, BookingParticipant, Court, Service, BookingChangeLog } = require('../models');
const { generateUUID } = require('../utils/uuid');
const { ConflictError, NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class BookingService extends BaseService {
  constructor() {
    super(Booking);
  }

  async createBooking(data, userId) {
    const { branch_id, items, participants, promo_code } = data;

    // ✅ accept status from UI
    const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'expired'];

    // UI might send status OR booking_status
    const requestedStatusRaw = data?.booking_status ?? data?.status;
    const requestedStatus = typeof requestedStatusRaw === 'string'
      ? requestedStatusRaw.trim().toLowerCase()
      : null;

    // default pending if not provided
    const bookingStatus = requestedStatus && allowedStatuses.includes(requestedStatus)
      ? requestedStatus
      : 'pending';

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
        if (!court || court.status !== 'active') {
          throw new NotFoundError('Court');
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
              as: 'booking',
              where: {
                booking_status: { [Op.notIn]: ['cancelled', 'expired'] },
                deleted_at: { [Op.is]: null },
              },
            },
          ],
          transaction: t,
        });

        if (existing) {
          throw new ConflictError('Court is already booked for this time slot');
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

          // ✅ FIXED: use requested status
          booking_status: bookingStatus,

          booking_source: 'customer_web',
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          fee_amount: feeAmount,
          total_amount: totalAmount,
          currency: 'USD',
          payment_status: 'pending',
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
          change_type: 'created',
          changed_by: userId,

          // ✅ FIXED: log correct status
          new_value: { status: bookingStatus },
        },
        { transaction: t }
      );

      return await Booking.findByPk(booking.id, {
        include: [
          { model: BookingItem, as: 'items' },
          { model: BookingParticipant, as: 'participants' },
        ],
        transaction: t,
      });
    });
  }

  async cancelBooking(bookingId, userId, reason) {
    const booking = await this.findById(bookingId);

    if (booking.booking_status === 'cancelled') {
      throw new ConflictError('Booking is already cancelled');
    }

    await booking.update({
      booking_status: 'cancelled',
      cancelled_at: new Date(),
      cancelled_by: userId,
      cancellation_reason: reason,
    });

    await BookingChangeLog.create({
      id: generateUUID(),
      booking_id: bookingId,
      change_type: 'cancelled',
      changed_by: userId,
      old_value: { status: booking.booking_status },
      new_value: { status: 'cancelled' },
      reason,
    });

    return booking.reload();
  }
}

module.exports = new BookingService();
