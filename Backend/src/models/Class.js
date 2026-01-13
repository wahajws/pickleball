module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define(
    "Class",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },

      company_id: { type: DataTypes.CHAR(36), allowNull: false },
      branch_id: { type: DataTypes.CHAR(36), allowNull: false },
      trainer_id: { type: DataTypes.CHAR(36), allowNull: false },

      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },

      capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 8 },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(3), defaultValue: "USD", allowNull: false },

      status: {
        type: DataTypes.ENUM("active", "inactive", "deleted"),
        defaultValue: "active",
      },

      created_by: { type: DataTypes.CHAR(36), allowNull: false },
      updated_by: { type: DataTypes.CHAR(36), allowNull: true },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "classes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Class.associate = (models) => {
    Class.belongsTo(models.Company, { foreignKey: "company_id", as: "company" });
    Class.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
    Class.belongsTo(models.Trainer, { foreignKey: "trainer_id", as: "trainer" });

    // later we can add: ClassSession / ClassBooking tables
    // (do NOT reference missing models now)
  };

  return Class;
};
