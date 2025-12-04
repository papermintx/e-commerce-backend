const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { generateTokens, verifyRefreshToken } = require('../config/jwt');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../config/email');
const { generateToken, generateExpirationTime } = require('../utils/token');

class AuthController {
  /**
   * Sign Up - Register user baru
   */
  async signUp(req, res) {
    try {
      const { email, password, fullName } = req.validatedBody;

      // Check if user already exists
      const existingUser = await prisma.profile.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate email verification token
      const emailVerifyToken = generateToken();
      const emailVerifyExpires = generateExpirationTime(24); // 24 hours

      // Create user
      const user = await prisma.profile.create({
        data: {
          email,
          password: hashedPassword,
          full_name: fullName,
          role: 'user',
          email_verified: false,
          email_verify_token: emailVerifyToken,
          email_verify_expires: emailVerifyExpires,
        },
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, emailVerifyToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't block signup if email fails
      }

      return res.status(201).json({
        success: true,
        message: 'Sign up successful! Please check your email to verify your account.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            emailVerified: user.email_verified,
          },
        },
      });
    } catch (error) {
      console.error('Sign up error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  /**
   * Sign In - Login user
   */
  async signIn(req, res) {
    try {
      const { email, password } = req.validatedBody;

      // Find user
      const user = await prisma.profile.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Save refresh token to database
      await prisma.profile.update({
        where: { id: user.id },
        data: { refresh_token: refreshToken },
      });

      return res.status(200).json({
        success: true,
        message: 'Sign in successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            emailVerified: user.email_verified,
            createdAt: user.created_at,
          },
          session: {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes in seconds
          },
        },
      });
    } catch (error) {
      console.error('Sign in error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  /**
   * Sign Out - Logout user
   */
  async signOut(req, res) {
    try {
      // Clear refresh token from database
      await prisma.profile.update({
        where: { id: req.user.id },
        data: { refresh_token: null },
      });

      return res.status(200).json({
        success: true,
        message: 'Sign out successful',
      });
    } catch (error) {
      console.error('Sign out error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  /**
   * Refresh Token - Generate new access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.validatedBody;

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find user and verify refresh token
      const user = await prisma.profile.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.refresh_token !== refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      // Update refresh token
      await prisma.profile.update({
        where: { id: user.id },
        data: { refresh_token: tokens.refreshToken },
      });

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          session: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 900, // 15 minutes
          },
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
          },
        },
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid refresh token',
      });
    }
  }

  /**
   * Get Profile - Get current user info
   */
  async getProfile(req, res) {
    try {
      return res.status(200).json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          fullName: req.user.user_metadata?.full_name,
          emailVerified: req.user.email_confirmed_at !== null,
          createdAt: req.user.created_at,
          updatedAt: req.user.updated_at,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  /**
   * Reset Password Request - Send reset password email
   */
  async resetPassword(req, res) {
    try {
      const { email } = req.validatedBody;

      // Find user
      const user = await prisma.profile.findUnique({
        where: { email },
      });

      // Always return success even if user not found (security best practice)
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If that email exists, a password reset link has been sent.',
        });
      }

      // Generate reset token
      const resetToken = generateToken();
      const resetExpires = generateExpirationTime(1); // 1 hour

      // Save token to database
      await prisma.profile.update({
        where: { id: user.id },
        data: {
          password_reset_token: resetToken,
          password_reset_expires: resetExpires,
        },
      });

      // Send reset email
      try {
        await sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }

      return res.status(200).json({
        success: true,
        message: 'If that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  /**
   * Update Password - Change user password with reset token
   */
  async updatePassword(req, res) {
    try {
      const { token, newPassword } = req.validatedBody;

      // Find user by reset token
      const user = await prisma.profile.findFirst({
        where: {
          password_reset_token: token,
          password_reset_expires: {
            gte: new Date(), // Token belum expired
          },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await prisma.profile.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      console.error('Update password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  /**
   * Verify Email Callback - Handle email verification
   */
  async verifyEmailCallback(req, res) {
    try {
      const { token } = req.validatedBody;

      // Find user by verification token
      const user = await prisma.profile.findFirst({
        where: {
          email_verify_token: token,
          email_verify_expires: {
            gte: new Date(),
          },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token',
        });
      }

      // Update user as verified
      await prisma.profile.update({
        where: { id: user.id },
        data: {
          email_verified: true,
          email_verify_token: null,
          email_verify_expires: null,
        },
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.full_name);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        email: user.email,
      });
    } catch (error) {
      console.error('Verify email error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  /**
   * Resend Verification Email
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.validatedBody;

      // Find user
      const user = await prisma.profile.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.email_verified) {
        return res.status(400).json({
          success: false,
          message: 'Email already verified',
        });
      }

      // Generate new token
      const emailVerifyToken = generateToken();
      const emailVerifyExpires = generateExpirationTime(24);

      // Update token
      await prisma.profile.update({
        where: { id: user.id },
        data: {
          email_verify_token: emailVerifyToken,
          email_verify_expires: emailVerifyExpires,
        },
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, emailVerifyToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  /**
   * Verify Email Page - HTML page untuk email verification
   */
  verifyEmailPage(req, res) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 50px;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            width: 90%;
          }
          .icon { font-size: 80px; margin-bottom: 30px; animation: fadeIn 0.5s; }
          .loading { animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
          h1 { color: #333; margin-bottom: 15px; font-size: 28px; }
          p { color: #666; line-height: 1.8; margin-bottom: 15px; font-size: 16px; }
          .email { font-weight: bold; color: #667eea; }
          .button {
            display: inline-block;
            margin-top: 25px;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            cursor: pointer;
            border: none;
            font-size: 16px;
            font-weight: bold;
            transition: transform 0.2s;
          }
          .button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
          #loading, #success, #error { display: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div id="loading">
            <div class="icon loading">⏳</div>
            <h1>Verifying Your Email...</h1>
            <p>Please wait while we confirm your email address.</p>
          </div>

          <div id="success">
            <div class="icon">✅</div>
            <h1>Email Verified Successfully!</h1>
            <p>Your email <span class="email" id="userEmail"></span> has been verified.</p>
            <p>You can now sign in to your account and start shopping!</p>
            <button class="button" onclick="window.close()">Close Window</button>
          </div>

          <div id="error">
            <div class="icon">❌</div>
            <h1>Verification Failed</h1>
            <p id="errorMessage">An error occurred during verification.</p>
            <button class="button" onclick="window.location.reload()">Try Again</button>
          </div>
        </div>

        <script>
          function getTokenFromUrl() {
            const params = new URLSearchParams(window.location.search);
            return params.get('token');
          }

          async function verifyEmail() {
            document.getElementById('loading').style.display = 'block';
            
            try {
              const token = getTokenFromUrl();
              
              if (!token) {
                throw new Error('No verification token found in URL');
              }

              const response = await fetch('/auth/verify-email/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
              });

              const result = await response.json();

              if (response.ok && result.success) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('success').style.display = 'block';
                document.getElementById('userEmail').textContent = result.email;
              } else {
                throw new Error(result.message || 'Verification failed');
              }
            } catch (error) {
              document.getElementById('loading').style.display = 'none';
              document.getElementById('error').style.display = 'block';
              document.getElementById('errorMessage').textContent = error.message;
            }
          }

          window.addEventListener('load', verifyEmail);
        </script>
      </body>
      </html>
    `);
  }

  /**
   * Reset Password Confirm Page - HTML page untuk reset password
   */
  resetPasswordConfirmPage(req, res) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .container {
            background: white;
            padding: 50px;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 450px;
            width: 100%;
          }
          h1 { color: #333; text-align: center; margin-bottom: 35px; font-size: 28px; }
          .icon { font-size: 50px; text-align: center; margin-bottom: 20px; }
          .form-group { margin-bottom: 25px; }
          label {
            display: block;
            color: #555;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 14px;
          }
          input {
            width: 100%;
            padding: 14px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 15px;
            transition: border-color 0.3s;
          }
          input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          .button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
          .button:disabled { background: #ccc; cursor: not-allowed; transform: none; }
          .message {
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            display: none;
            animation: slideDown 0.3s;
          }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
          .info-text { font-size: 13px; color: #999; margin-top: 5px; }
          .password-strength {
            height: 4px;
            background: #e0e0e0;
            border-radius: 2px;
            margin-top: 8px;
            overflow: hidden;
          }
          .password-strength-bar {
            height: 100%;
            width: 0%;
            transition: all 0.3s;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔐</div>
          <h1>Reset Your Password</h1>
          
          <form id="resetForm">
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input 
                type="password" 
                id="newPassword"
                placeholder="Enter your new password"
                required
                minlength="6"
              />
              <div class="password-strength">
                <div class="password-strength-bar" id="strengthBar"></div>
              </div>
              <p class="info-text">Minimum 6 characters</p>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword"
                placeholder="Confirm your new password"
                required
                minlength="6"
              />
            </div>

            <button type="submit" class="button" id="submitBtn">Reset Password</button>
          </form>

          <div id="message" class="message"></div>
        </div>

        <script>
          const newPasswordInput = document.getElementById('newPassword');
          const strengthBar = document.getElementById('strengthBar');

          newPasswordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            let strength = 0;
            
            if (password.length >= 6) strength += 25;
            if (password.length >= 10) strength += 25;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
            if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) strength += 25;

            strengthBar.style.width = strength + '%';
            strengthBar.style.background = 
              strength < 50 ? '#f44336' : 
              strength < 75 ? '#ff9800' : '#4CAF50';
          });

          document.getElementById('resetForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const messageDiv = document.getElementById('message');
            const submitBtn = document.getElementById('submitBtn');

            if (newPassword !== confirmPassword) {
              messageDiv.textContent = '❌ Passwords do not match!';
              messageDiv.className = 'message error';
              messageDiv.style.display = 'block';
              return;
            }

            try {
              submitBtn.disabled = true;
              submitBtn.textContent = 'Resetting Password...';

              const params = new URLSearchParams(window.location.search);
              const token = params.get('token');

              if (!token) {
                throw new Error('Invalid reset link. Please request a new password reset.');
              }

              const response = await fetch('/auth/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
              });

              const result = await response.json();

              if (response.ok && result.success) {
                messageDiv.textContent = '✅ Password reset successfully! You can now log in with your new password.';
                messageDiv.className = 'message success';
                messageDiv.style.display = 'block';
                document.getElementById('resetForm').style.display = 'none';
                
                setTimeout(() => window.close(), 3000);
              } else {
                throw new Error(result.message || 'Failed to reset password');
              }
            } catch (error) {
              messageDiv.textContent = '❌ ' + error.message;
              messageDiv.className = 'message error';
              messageDiv.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Reset Password';
            }
          });
        </script>
      </body>
      </html>
    `);
  }

  /**
   * Get Profile - Get current user profile
   */
  async getProfile(req, res) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          full_name: true,
          phone: true,
          role: true,
          avatar_url: true,
          email_verified: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
