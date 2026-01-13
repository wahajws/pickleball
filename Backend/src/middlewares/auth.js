const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { UnauthorizedError } = require("../utils/errors");
const { User, UserRole, Role } = require("../models");
const { Op } = require("sequelize");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (e) {
      throw new UnauthorizedError("Invalid token");
    }

    const user = await User.findByPk(decoded.userId);

    if (!user || user.status === "deleted" || user.status === "suspended") {
      throw new UnauthorizedError("Invalid or inactive user");
    }

    // Fetch roles without depending on User.associate aliases
    const userRoles = await UserRole.findAll({
      where: {
        user_id: user.id,
        deleted_at: { [Op.is]: null },
      },
      include: [
        {
          model: Role,
          as: "role", // must match your UserRole.belongsTo(models.Role, { as: "role" })
          required: false,
        },
      ],
    });

    // Make role names available everywhere
    const roleNames = (userRoles || [])
      .map((ur) => ur?.role?.name)
      .filter(Boolean);

    req.user = user;
    req.userId = user.id;
    req.userRoles = userRoles;
    req.roleNames = roleNames;

    next();
  } catch (err) {
    next(err);
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  return authenticate(req, res, next);
}

module.exports = {
  authenticate,
  optionalAuth,
};
