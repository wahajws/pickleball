module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define(
    "Class",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },

      company_id: { type: DataTypes.CHAR(36), allowNull: false },
      branch_id: { type: DataTypes.CHAR(36), allowNull: false },
      trainer_id: { type: DataTypes.CHAR(36), allowNull: false },

      name: { type: DataTypes.STRING(150), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },

      // ✅ YOU MISSED THIS (matches DB)
      duration_mins: { type: DataTypes.INTEGER, allowNull: false },

      capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

      // ✅ DB has currency (varchar(3))
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "MYR" },

      // ✅ DB enum is ('active','inactive') (NOT deleted)
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },

      created_by: { type: DataTypes.CHAR(36), allowNull: true },
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
  };

  return Class;
};
