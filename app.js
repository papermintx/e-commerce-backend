require('dotenv').config();
const express = require('express');
const path = require('path');
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const publicRoutes = require('./src/routes/public.routes');
const { verifyEmailConfig } = require('./src/config/email');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS middleware (optional - untuk frontend development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Request logging middleware (optional)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// Routes
// ============================================

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'E-Commerce API',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
app.use('/auth', authRoutes);

// Admin routes (protected, admin only)
app.use('/api/admin', adminRoutes);

// Public routes (no authentication required)
app.use('/api/public', publicRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, async () => {
  console.log('='.repeat(50));
  console.log(`🚀 E-Commerce API Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
  
  // Verify email configuration
  await verifyEmailConfig();
});

module.exports = app;