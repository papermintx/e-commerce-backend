/**
 * Manual validation functions untuk DTO
 * Karena decorator tidak didukung di JavaScript standar
 */

const validateSignUpDto = (data) => {
  const errors = [];

  // Validate email
  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Email must be a valid email address' });
  }

  // Validate password
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (typeof data.password !== 'string') {
    errors.push({ field: 'password', message: 'Password must be a string' });
  } else if (data.password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  // Validate fullName
  if (!data.fullName) {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  } else if (typeof data.fullName !== 'string') {
    errors.push({ field: 'fullName', message: 'Full name must be a string' });
  }

  return errors;
};

const validateSignInDto = (data) => {
  const errors = [];

  // Validate email
  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Email must be a valid email address' });
  }

  // Validate password
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (typeof data.password !== 'string') {
    errors.push({ field: 'password', message: 'Password must be a string' });
  }

  return errors;
};

const validateRefreshTokenDto = (data) => {
  const errors = [];

  if (!data.refreshToken) {
    errors.push({ field: 'refreshToken', message: 'Refresh token is required' });
  } else if (typeof data.refreshToken !== 'string') {
    errors.push({ field: 'refreshToken', message: 'Refresh token must be a string' });
  }

  return errors;
};

const validateResetPasswordDto = (data) => {
  const errors = [];

  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Email must be a valid email address' });
  }

  return errors;
};

const validateUpdatePasswordDto = (data) => {
  const errors = [];

  // Validate token
  if (!data.token) {
    errors.push({ field: 'token', message: 'Reset token is required' });
  } else if (typeof data.token !== 'string') {
    errors.push({ field: 'token', message: 'Reset token must be a string' });
  }

  // Validate newPassword
  if (!data.newPassword) {
    errors.push({ field: 'newPassword', message: 'New password is required' });
  } else if (typeof data.newPassword !== 'string') {
    errors.push({ field: 'newPassword', message: 'New password must be a string' });
  } else if (data.newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters long' });
  }

  return errors;
};

const validateVerifyEmailCallbackDto = (data) => {
  const errors = [];

  // Validate token
  if (!data.token) {
    errors.push({ field: 'token', message: 'Verification token is required' });
  } else if (typeof data.token !== 'string') {
    errors.push({ field: 'token', message: 'Verification token must be a string' });
  }

  return errors;
};

const validateResendVerificationDto = (data) => {
  const errors = [];

  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Email must be a valid email address' });
  }

  return errors;
};

module.exports = {
  validateSignUpDto,
  validateSignInDto,
  validateRefreshTokenDto,
  validateResetPasswordDto,
  validateUpdatePasswordDto,
  validateVerifyEmailCallbackDto,
  validateResendVerificationDto,
};
