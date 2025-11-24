const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validateDto = require('../middleware/validate.middleware');
const {
  validateSignUpDto,
  validateSignInDto,
  validateRefreshTokenDto,
  validateResetPasswordDto,
  validateUpdatePasswordDto,
  validateVerifyEmailCallbackDto,
  validateResendVerificationDto,
} = require('../dto/auth.dto');

// ============================================
// Public Routes (No Authentication Required)
// ============================================

/**
 * @route   POST /auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', validateDto(validateSignUpDto), authController.signUp);

/**
 * @route   POST /auth/signin
 * @desc    Login user
 * @access  Public
 */
router.post('/signin', validateDto(validateSignInDto), authController.signIn);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validateDto(validateRefreshTokenDto), authController.refreshToken);

/**
 * @route   POST /auth/reset-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/reset-password', validateDto(validateResetPasswordDto), authController.resetPassword);

/**
 * @route   POST /auth/update-password
 * @desc    Update password with reset token
 * @access  Public
 */
router.post('/update-password', validateDto(validateUpdatePasswordDto), authController.updatePassword);

/**
 * @route   POST /auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', validateDto(validateResendVerificationDto), authController.resendVerification);

/**
 * @route   POST /auth/verify-email/callback
 * @desc    Verify email with token (called from frontend)
 * @access  Public
 */
router.post('/verify-email/callback', validateDto(validateVerifyEmailCallbackDto), authController.verifyEmailCallback);

/**
 * @route   GET /auth/verify-email
 * @desc    Email verification page (HTML)
 * @access  Public
 */
router.get('/verify-email', authController.verifyEmailPage);

/**
 * @route   GET /auth/reset-password-confirm
 * @desc    Reset password confirmation page (HTML)
 * @access  Public
 */
router.get('/reset-password-confirm', authController.resetPasswordConfirmPage);

// ============================================
// Protected Routes (Authentication Required)
// ============================================

/**
 * @route   POST /auth/signout
 * @desc    Logout user
 * @access  Private
 */
router.post('/signout', authMiddleware, authController.signOut);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getProfile);

module.exports = router;
