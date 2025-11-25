const prisma = require('../config/prisma');

/**
 * Middleware to check if user has required role
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['admin', 'user'])
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // User must be authenticated first (set by auth.middleware.js)
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Get user profile from database to check role
      let profile = await prisma.profile.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, role: true, full_name: true },
      });

      // Auto-create profile if not exists (fallback untuk user lama)
      if (!profile) {
        try {
          profile = await prisma.profile.create({
            data: {
              id: req.user.id,
              email: req.user.email,
              full_name: req.user.user_metadata?.full_name || null,
              role: 'user', // Default role
            },
            select: { id: true, email: true, role: true, full_name: true },
          });
          console.log(`✅ Auto-created profile for user: ${req.user.email}`);
        } catch (createError) {
          console.error('Failed to auto-create profile:', createError);
          return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create user profile',
          });
        }
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(profile.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        });
      }

      // Attach profile to request for later use
      req.profile = profile;
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify user role',
      });
    }
  };
};

/**
 * Shorthand middleware for admin-only routes
 */
const requireAdmin = requireRole('admin');

/**
 * Shorthand middleware for user routes (both admin and user can access)
 */
const requireUser = requireRole('admin', 'user');

module.exports = {
  requireRole,
  requireAdmin,
  requireUser,
};
