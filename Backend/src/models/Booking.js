module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    company_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    branch_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    booking_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    booking_status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'expired'),
      defaultValue: 'pending',
      allowNull: false
    },
    booking_source: {
      type: DataTypes.ENUM('customer_web', 'customer_app', 'admin_manual', 'admin_api'),
      defaultValue: 'customer_web',
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false
    },
    fee_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'MYR',
      allowNull: false
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded'),
      defaultValue: 'pending',
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelled_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    created_by: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'bookings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Booking.associate = function(models) {
    Booking.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Booking.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    Booking.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    Booking.hasMany(models.BookingItem, { foreignKey: 'booking_id', as: 'items' });
    Booking.hasMany(models.BookingParticipant, { foreignKey: 'booking_id', as: 'participants' });
  };

  return Booking;
};



