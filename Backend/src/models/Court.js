module.exports = (sequelize, DataTypes) => {
  const Court = sequelize.define(
    "Court",
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4, // auto-generate UUID
      },

      branch_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: { model: "branches", key: "id" },
      },

      name: { type: DataTypes.STRING(255), allowNull: false },

      court_number: { type: DataTypes.STRING(50), allowNull: true },

      court_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pickleball",
      },

      surface_type: {
        type: DataTypes.ENUM("indoor", "outdoor", "hard", "clay", "grass", "synthetic"),
        allowNull: true,
      },

      description: { type: DataTypes.TEXT, allowNull: true },

      capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 4 },

      has_lights: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

      status: {
        type: DataTypes.ENUM("active", "maintenance", "closed", "deleted"),
        allowNull: false,
        defaultValue: "active",
      },

      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

      created_by: { type: DataTypes.CHAR(36), allowNull: false },
      updated_by: { type: DataTypes.CHAR(36), allowNull: true },

      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "courts",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Court.associate = function (models) {
    Court.belongsTo(models.Branch, { foreignKey: "branch_id", as: "branch" });
  };

  return Court;
};
