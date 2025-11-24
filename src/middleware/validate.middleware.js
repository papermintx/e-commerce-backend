/**
 * Middleware untuk validasi DTO
 * @param {Function} validateFunction - Fungsi validasi dari auth.dto.js
 */
const validateDto = (validateFunction) => {
  return (req, res, next) => {
    try {
      // Validate request body
      const errors = validateFunction(req.body);

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors,
        });
      }

      // Attach validated body to request
      req.validatedBody = req.body;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
    }
  };
};

module.exports = validateDto;
