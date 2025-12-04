#!/usr/bin/env node

/**
 * Generate JWT Secrets Helper
 * 
 * Script ini digunakan untuk generate JWT secrets yang secure
 * menggunakan built-in Node.js crypto module
 */

const crypto = require('node:crypto');

console.log('\n='.repeat(60));
console.log('🔐 JWT Secrets Generator');
console.log('='.repeat(60));
console.log('\nGenerate 2 random secrets untuk JWT authentication:\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET (untuk Access Token):');
console.log(jwtSecret);
console.log('');

// Generate JWT Refresh Secret
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_REFRESH_SECRET (untuk Refresh Token):');
console.log(jwtRefreshSecret);
console.log('');

console.log('='.repeat(60));
console.log('\n✅ Copy kedua secrets di atas ke file .env Anda:');
console.log('');
console.log(`JWT_SECRET="${jwtSecret}"`);
console.log(`JWT_REFRESH_SECRET="${jwtRefreshSecret}"`);
console.log('');
console.log('='.repeat(60));
console.log('\n⚠️  PENTING:');
console.log('- Jangan share secrets ini ke siapapun');
console.log('- Jangan commit secrets ke Git');
console.log('- Gunakan secrets berbeda untuk production');
console.log('');
