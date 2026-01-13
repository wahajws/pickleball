const { Op } = require("sequelize");
const { UserRole, Role } = require("../models");

const CONSOLE_ROLE_TYPES = new Set([
  "platform_super_admin",
  "company_admin",
  "branch_manager",
  "branch_staff",
]);

async function isConsoleUser(userId, companyId) {
  if (!userId) return false;

  const roles = await UserRole.findAll({
    where: {
      user_id: userId,
      ...(companyId
        ? {
            [Op.or]: [{ company_id: null }, { company_id: companyId }],
          }
        : {}),
      deleted_at: null,
    },
    include: [{ model: Role, as: "role" }],
  });

  const roleTypes = roles
    .map((ur) => ur?.role?.role_type)
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());

  return roleTypes.some((rt) => CONSOLE_ROLE_TYPES.has(rt));
}

module.exports = { isConsoleUser };
