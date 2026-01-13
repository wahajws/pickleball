module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define('Branch', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true
    },
    company_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address_line1: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    address_line2: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'deleted'),
      defaultValue: 'active',
      allowNull: false
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
    tableName: 'branches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Branch.associate = function(models) {
    Branch.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    Branch.hasMany(models.Court, { foreignKey: 'branch_id', as: 'courts' });
    Branch.hasMany(models.BranchContact, { foreignKey: 'branch_id', as: 'contacts' });
    Branch.hasMany(models.CourtPricingRule, { foreignKey: "branch_id", as: "pricing_rules" });
    Branch.hasMany(models.Trainer, { foreignKey: "branch_id", as: "trainers" });
    Branch.hasMany(models.Class, { foreignKey: "branch_id", as: "classes" });
    Branch.hasMany(models.TrainerBooking, { foreignKey: "branch_id", as: "trainer_bookings" });
  };
  

  return Branch;
};



