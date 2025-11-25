const supabase = require('../config/supabase');

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

    // Verify token dengan Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: error?.message,
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

// Export with both names for compatibility
module.exports = authMiddleware;
module.exports.authenticate = authMiddleware;
