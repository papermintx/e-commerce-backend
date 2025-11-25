const prisma = require('../../config/prisma');
const { generateUniqueSlug } = require('../../utils/slug');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

/**
 * Create new category
 * POST /api/admin/categories
 */
const createCategory = async (req, res) => {
  try {
    const { name, description, image_url, is_active } = req.body;

    // Check if category with same name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category with this name already exists',
      });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(name, async (slugToCheck) => {
      const category = await prisma.category.findUnique({
        where: { slug: slugToCheck },
      });
      return !!category;
    });

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image_url: image_url || null,
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    return res.status(201).json({
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create category',
    });
  }
};

/**
 * Get all categories with filters and pagination
 * GET /api/admin/categories
 */
const getAllCategories = async (req, res) => {
  try {
    const { page, limit, search, is_active } = req.query;

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    // Get pagination params
    const { skip, take, page: currentPage, limit: currentLimit } = getPaginationParams(page, limit);

    // Get total count
    const total = await prisma.category.count({ where });

    // Get categories
    const categories = await prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Get pagination meta
    const meta = getPaginationMeta(currentPage, currentLimit, total);

    return res.status(200).json({
      message: 'Categories retrieved successfully',
      data: categories,
      meta,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve categories',
    });
  }
};

/**
 * Get category by ID
 * GET /api/admin/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found',
      });
    }

    return res.status(200).json({
      message: 'Category retrieved successfully',
      data: category,
    });
  } catch (error) {
    console.error('Get category error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve category',
    });
  }
};

/**
 * Update category
 * PUT /api/admin/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, is_active } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found',
      });
    }

    // If name is being changed, check for duplicates and generate new slug
    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      const duplicateName = await prisma.category.findFirst({
        where: {
          name,
          NOT: { id },
        },
      });

      if (duplicateName) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Category with this name already exists',
        });
      }

      // Generate new slug
      slug = await generateUniqueSlug(name, async (slugToCheck) => {
        const category = await prisma.category.findFirst({
          where: {
            slug: slugToCheck,
            NOT: { id },
          },
        });
        return !!category;
      });
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name, slug }),
        ...(description !== undefined && { description }),
        ...(image_url !== undefined && { image_url }),
        ...(is_active !== undefined && { is_active }),
      },
    });

    return res.status(200).json({
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update category',
    });
  }
};

/**
 * Delete category
 * DELETE /api/admin/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found',
      });
    }

    // Check if category has products
    if (category._count.products > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Cannot delete category with ${category._count.products} associated products`,
      });
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    });

    return res.status(200).json({
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete category',
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
