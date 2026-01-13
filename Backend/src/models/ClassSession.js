module.exports = (sequelize, DataTypes) => {
  const ClassSession = sequelize.define("ClassSession", {
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    class_id: { type: DataTypes.CHAR(36), allowNull: false },

    start_datetime: { type: DataTypes.DATE, allowNull: false },
    end_datetime: { type: DataTypes.DATE, allowNull: false },

    status: { type: DataTypes.ENUM("scheduled","cancelled","completed"), defaultValue: "scheduled" },

    created_by: { type: DataTypes.CHAR(36), allowNull: false },
    updated_by: { type: DataTypes.CHAR(36), allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: "class_sessions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  ClassSession.associate = (models) => {
    ClassSession.belongsTo(models.Class, { foreignKey: "class_id", as: "class" });
  };

  return ClassSession;
};
