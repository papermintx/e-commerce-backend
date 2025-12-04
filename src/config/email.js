const nodemailer = require('nodemailer');

// Email Configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true'; // true for 465, false for other ports
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const APP_NAME = process.env.APP_NAME || 'E-Commerce Fashion Store';

// Create reusable transporter
const transporter = nodemailer.createTransporter({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_SECURE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

/**
 * Verify email configuration
 */
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
}

/**
 * Send Verification Email
 */
async function sendVerificationEmail(email, token) {
  const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"${APP_NAME}" <${EMAIL_FROM}>`,
    to: email,
    subject: `Verify Your Email - ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          .token-box { background: white; padding: 15px; border: 2px dashed #667eea; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${APP_NAME}!</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi there! 👋</p>
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            
            <center>
              <a href="${verificationUrl}" class="button">✅ Verify Email Address</a>
            </center>
            
            <p style="margin-top: 30px;">Or copy and paste this link into your browser:</p>
            <div class="token-box">${verificationUrl}</div>
            
            <p><strong>⏰ This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to ${APP_NAME}!
      
      Please verify your email address by visiting this link:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, you can safely ignore this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw error;
  }
}

/**
 * Send Password Reset Email
 */
async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${APP_URL}/auth/reset-password-confirm?token=${token}`;

  const mailOptions = {
    from: `"${APP_NAME}" <${EMAIL_FROM}>`,
    to: email,
    subject: `Reset Your Password - ${APP_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .token-box { background: white; padding: 15px; border: 2px dashed #667eea; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi there! 👋</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <center>
              <a href="${resetUrl}" class="button">🔑 Reset Password</a>
            </center>
            
            <p style="margin-top: 30px;">Or copy and paste this link into your browser:</p>
            <div class="token-box">${resetUrl}</div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour for security reasons.<br>
              If you didn't request this, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request - ${APP_NAME}
      
      We received a request to reset your password.
      
      Click this link to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw error;
  }
}

/**
 * Send Welcome Email (after verification)
 */
async function sendWelcomeEmail(email, fullName) {
  const mailOptions = {
    from: `"${APP_NAME}" <${EMAIL_FROM}>`,
    to: email,
    subject: `Welcome to ${APP_NAME}! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .feature-item { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${APP_NAME}!</h1>
          </div>
          <div class="content">
            <h2>Hi ${fullName || 'there'}! 👋</h2>
            <p>Your email has been verified successfully! Welcome to our fashion community.</p>
            
            <div class="features">
              <h3>What you can do now:</h3>
              <div class="feature-item">✨ Browse our latest fashion collections</div>
              <div class="feature-item">🛍️ Add items to your cart and wishlist</div>
              <div class="feature-item">💝 Get exclusive deals and offers</div>
              <div class="feature-item">📦 Track your orders easily</div>
            </div>
            
            <center>
              <a href="${APP_URL}" class="button">🛒 Start Shopping</a>
            </center>
            
            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Happy shopping! 🎊</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
}

module.exports = {
  transporter,
  verifyEmailConfig,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
