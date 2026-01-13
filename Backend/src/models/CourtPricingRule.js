module.exports = (sequelize, DataTypes) => {
  const CourtPricingRule = sequelize.define(
    "CourtPricingRule",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, // auto create uuid
      },

      company_id: { type: DataTypes.CHAR(36), allowNull: false },
      branch_id: { type: DataTypes.CHAR(36), allowNull: false },
      court_id: { type: DataTypes.CHAR(36), allowNull: true }, // null = branch-wide rule

      name: { type: DataTypes.STRING(120), allowNull: false },

      // 0=Sun ... 6=Sat
      day_of_week: { type: DataTypes.TINYINT, allowNull: false },

      start_time: { type: DataTypes.TIME, allowNull: false },
      end_time: { type: DataTypes.TIME, allowNull: false },

      price_per_hour: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "USD" },

      effective_from: { type: DataTypes.DATEONLY, allowNull: true },
      effective_to: { type: DataTypes.DATEONLY, allowNull: true },

      priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },

      created_by: { type: DataTypes.CHAR(36), allowNull: false },
      updated_by: { type: DataTypes.CHAR(36), allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "court_pricing_rules",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  CourtPricingRule.associate = (models) => {
    CourtPricingRule.belongsTo(models.Company, { foreignKey: "company_id", as: "company" });
    CourtPricingRule.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
    CourtPricingRule.belongsTo(models.Court, { foreignKey: "court_id", as: "court" });
  };

  return CourtPricingRule;
};
