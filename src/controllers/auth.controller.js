const supabase = require('../config/supabase');
const prisma = require('../config/prisma');

class AuthController {
  /**
   * Sign Up - Register user baru
   */
  async signUp(req, res) {
    try {
      const { email, password, fullName } = req.validatedBody;

      // Sign up di Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-email`,
        },
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Create profile di database
      if (data.user) {
        try {
          await prisma.profile.create({
            data: {
              id: data.user.id,
              email: data.user.email,
              full_name: fullName || data.user.user_metadata?.full_name,
              role: 'user', // Default role
            },
          });
        } catch (dbError) {
          console.error('Failed to create profile:', dbError);
          // Don't block signup if profile creation fails
          // Profile akan di-create saat first login
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Sign up successful! Please check your email to verify your account.',
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name,
            emailVerified: data.user.email_confirmed_at !== null,
          },
          session: data.session ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
          } : null,
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
   * Sign In - Login user
   */
  async signIn(req, res) {
    try {
      const { email, password } = req.validatedBody;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Sign in successful',
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name,
            emailVerified: data.user.email_confirmed_at !== null,
            createdAt: data.user.created_at,
          },
          session: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            expiresAt: data.session.expires_at,
          },
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
   * Sign Out - Logout user
   */
  async signOut(req, res) {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Sign out successful',
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
   * Refresh Token - Generate new access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.validatedBody;

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          session: {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            expiresAt: data.session.expires_at,
          },
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name,
          },
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

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password-confirm`,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Password reset email sent! Please check your inbox.',
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
   * Update Password - Change user password
   */
  async updatePassword(req, res) {
    try {
      const { accessToken, newPassword } = req.validatedBody;

      // Set session with access token
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: accessToken,
      });

      if (sessionError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid access token',
        });
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
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
   * Verify Email Callback - Handle email verification
   */
  async verifyEmailCallback(req, res) {
    try {
      const { accessToken, type } = req.validatedBody;

      const { data: { user }, error } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification token',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        email: user.email,
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
   * Resend Verification Email
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.validatedBody;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify-email`,
        },
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
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
          function parseHashFragment() {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            return {
              access_token: params.get('access_token'),
              refresh_token: params.get('refresh_token'),
              type: params.get('type')
            };
          }

          async function verifyEmail() {
            document.getElementById('loading').style.display = 'block';
            
            try {
              const tokens = parseHashFragment();
              
              if (!tokens.access_token) {
                throw new Error('No verification token found in URL');
              }

              const response = await fetch('/auth/verify-email/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  accessToken: tokens.access_token,
                  type: tokens.type || 'signup'
                })
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

              const hash = window.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');

              if (!accessToken) {
                throw new Error('Invalid reset link. Please request a new password reset.');
              }

              const response = await fetch('/auth/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, newPassword })
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
   * Get Profile - Get current user profile with auto-create if not exists
   */
  async getProfile(req, res) {
    try {
      // req.user sudah di-set oleh auth.middleware.js
      const userId = req.user.id;

      // Cari profile di database
      let profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          phone: true,
          role: true,
          avatar_url: true,
          created_at: true,
          updated_at: true,
        },
      });

      // Auto-create profile jika belum ada
      if (!profile) {
        profile = await prisma.profile.create({
          data: {
            id: userId,
            email: req.user.email,
            full_name: req.user.user_metadata?.full_name || null,
            role: 'user', // Default role
          },
          select: {
            id: true,
            email: true,
            full_name: true,
            phone: true,
            role: true,
            avatar_url: true,
            created_at: true,
            updated_at: true,
          },
        });
        console.log(`✅ Auto-created profile for user: ${req.user.email}`);
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
