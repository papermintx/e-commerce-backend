const express = require('express');
const router = express.Router();
const productController = require('../controllers/public/product.controller');

// ============================================
// Public Product Routes (No Authentication)
// ============================================

/**
 * @route   GET /api/public/products
 * @desc    Get all products with filters and pagination
 * @access  Public
 */
router.get('/products', productController.getAllProducts);

/**
 * @route   GET /api/public/products/featured
 * @desc    Get featured products for homepage
 * @access  Public
 */
router.get('/products/featured', productController.getFeaturedProducts);

/**
 * @route   GET /api/public/products/:slug
 * @desc    Get product by slug with full details and carousel images
 * @access  Public
 */
router.get('/products/:slug', productController.getProductBySlug);

/**
 * @route   GET /api/public/products/:slug/related
 * @desc    Get related products (same category)
 * @access  Public
 */
router.get('/products/:slug/related', productController.getRelatedProducts);

module.exports = router;
