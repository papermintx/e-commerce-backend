const { verifyAccessToken } = require('../config/jwt');
const prisma = require('../config/prisma');

/**
 * Middleware untuk autentikasi JWT
 * Memverifikasi token dari header Authorization
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required. Please provide token in Authorization header.',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await prisma.profile.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        email_verified: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

// Export with both names for compatibility
module.exports = authMiddleware;
module.exports.authenticate = authMiddleware;
