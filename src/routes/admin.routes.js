const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { upload } = require('../services/upload.service');
const { validateCreateCategoryDto, validateUpdateCategoryDto } = require('../dto/category.dto');
const { validateCreateProductDto, validateUpdateProductDto, validateUpdateStockDto } = require('../dto/product.dto');
const categoryController = require('../controllers/admin/category.controller');
const productController = require('../controllers/admin/product.controller');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// ============================================
// Category Management
// ============================================
router.post('/categories', validate(validateCreateCategoryDto), categoryController.createCategory);
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.put('/categories/:id', validate(validateUpdateCategoryDto), categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// ============================================
// Product Management (with Multiple Image Upload)
// ============================================

/**
 * @route   POST /api/admin/products
 * @desc    Create product with multiple images (max 5)
 * @access  Admin only
 */
router.post(
  '/products',
  upload.array('images', 5), // Max 5 images for carousel
  validate(validateCreateProductDto),
  productController.createProduct
);

/**
 * @route   GET /api/admin/products
 * @desc    Get all products with filters and pagination
 * @access  Admin only
 */
router.get('/products', productController.getAllProducts);

/**
 * @route   GET /api/admin/products/:id
 * @desc    Get product by ID
 * @access  Admin only
 */
router.get('/products/:id', productController.getProductById);

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Update product (can add/remove images)
 * @access  Admin only
 */
router.put(
  '/products/:id',
  upload.array('images', 5), // Additional images
  validate(validateUpdateProductDto),
  productController.updateProduct
);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete product and its images
 * @access  Admin only
 */
router.delete('/products/:id', productController.deleteProduct);

/**
 * @route   PATCH /api/admin/products/:id/stock
 * @desc    Update product stock
 * @access  Admin only
 */
router.patch('/products/:id/stock', validate(validateUpdateStockDto), productController.updateStock);

/**
 * @route   PATCH /api/admin/products/:id/featured
 * @desc    Toggle product featured status
 * @access  Admin only
 */
router.patch('/products/:id/featured', productController.toggleFeatured);

module.exports = router;
