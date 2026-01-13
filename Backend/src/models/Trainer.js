module.exports = (sequelize, DataTypes) => {
  const Trainer = sequelize.define(
    "Trainer",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },

      company_id: { type: DataTypes.CHAR(36), allowNull: false },
      branch_id: {
        type: DataTypes.CHAR(36),
        allowNull: true, // allow company-wide trainers later
      },

      name: { type: DataTypes.STRING(255), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(50), allowNull: true },

      bio: { type: DataTypes.TEXT, allowNull: true },
      hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "USD",
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("active", "inactive", "deleted"),
        defaultValue: "active",
      },

      created_by: { type: DataTypes.CHAR(36), allowNull: false },
      updated_by: { type: DataTypes.CHAR(36), allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "trainers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",

      // keep it consistent with your other models (manual soft delete)
      // If later you want Sequelize paranoid, we can enable it — but not now.
    }
  );

  Trainer.associate = (models) => {
    Trainer.belongsTo(models.Company, { foreignKey: "company_id", as: "company" });
    Trainer.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });

    // Make this safe: your class model might be named Class OR ClassSession
    const ClassModel = models.Class || models.ClassSession || models.ClassSessionModel;
    if (ClassModel) {
      Trainer.hasMany(ClassModel, { foreignKey: "trainer_id", as: "classes" });
    }

    if (models.TrainerBooking) {
      Trainer.hasMany(models.TrainerBooking, { foreignKey: "trainer_id", as: "bookings" });
    }
  };

  return Trainer;
};
