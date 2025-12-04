const crypto = require('node:crypto');

/**
 * Generate random token untuk email verification dan password reset
 * Menggunakan built-in Node.js crypto module (node:crypto)
 * @param {number} length - Panjang token (default 32 bytes = 64 karakter hex)
 * @returns {string} - Random token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate expiration time
 * @param {number} hours - Jumlah jam dari sekarang
 * @returns {Date} - Expiration date
 */
function generateExpirationTime(hours = 24) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

module.exports = {
  generateToken,
  generateExpirationTime,
};
