module.exports = (sequelize, DataTypes) => {
  const TrainerBooking = sequelize.define("TrainerBooking", {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    company_id: { type: DataTypes.CHAR(36), allowNull: false },
    branch_id: { type: DataTypes.CHAR(36), allowNull: false },
    trainer_id: { type: DataTypes.CHAR(36), allowNull: false },
    class_id: { type: DataTypes.CHAR(36), allowNull: true },
    customer_id: { type: DataTypes.CHAR(36), allowNull: true }, // for demo admin can create without customer
    start_datetime: { type: DataTypes.DATE, allowNull: false },
    end_datetime: { type: DataTypes.DATE, allowNull: false },

    hourly_rate: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: "USD", allowNull: false },

    status: { type: DataTypes.ENUM("booked","cancelled","completed"), defaultValue: "booked" },

    created_by: { type: DataTypes.CHAR(36), allowNull: false },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: "trainer_bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  TrainerBooking.associate = (models) => {
    TrainerBooking.belongsTo(models.Company, { foreignKey: "company_id", as: "company" });
    TrainerBooking.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
    TrainerBooking.belongsTo(models.Trainer, { foreignKey: "trainer_id", as: "trainer" });
    TrainerBooking.belongsTo(models.Class, { foreignKey: "class_id", as: "class" });
  };

  return TrainerBooking;
};
