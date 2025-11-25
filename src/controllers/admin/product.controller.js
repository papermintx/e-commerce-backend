const prisma = require('../../config/prisma');
const { generateUniqueSlug } = require('../../utils/slug');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');
const { uploadMultipleToSupabase, deleteFromSupabase } = require('../../services/upload.service');

class ProductController {
  /**
   * Create Product with Multiple Images
   */
  async createProduct(req, res) {
    try {
      const {
        name,
        description,
        price,
        discount_price,
        stock,
        category_id,
        sku,
        sizes,
        colors,
        weight,
        is_featured,
        is_active,
      } = req.validatedBody;

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: category_id },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      // Check if SKU already exists
      const existingSku = await prisma.product.findUnique({
        where: { sku },
      });

      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists',
        });
      }

      // Generate unique slug
      const slug = await generateUniqueSlug(name, async (slug) => {
        const existing = await prisma.product.findUnique({ where: { slug } });
        return !!existing;
      });

      // Handle multiple image uploads
      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        try {
          const uploadResults = await uploadMultipleToSupabase(
            req.files,
            process.env.SUPABASE_STORAGE_BUCKET_PRODUCTS || 'products',
            'products'
          );
          imageUrls = uploadResults.map((result) => result.publicUrl);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: uploadError.message,
          });
        }
      }

      // Parse JSON fields
      const parsedSizes = sizes ? (typeof sizes === 'string' ? JSON.parse(sizes) : sizes) : [];
      const parsedColors = colors ? (typeof colors === 'string' ? JSON.parse(colors) : colors) : [];

      // Create product
      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description,
          price: parseFloat(price),
          discount_price: discount_price ? parseFloat(discount_price) : null,
          stock: parseInt(stock),
          category_id,
          sku,
          images: imageUrls, // Array of image URLs for carousel
          sizes: parsedSizes,
          colors: parsedColors,
          weight: weight ? parseFloat(weight) : null,
          is_featured: is_featured === 'true' || is_featured === true,
          is_active: is_active !== undefined ? is_active === 'true' || is_active === true : true,
          created_by: req.profile.id,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      console.error('Create product error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message,
      });
    }
  }

  /**
   * Get All Products with Pagination and Filters
   */
  async getAllProducts(req, res) {
    try {
      const { page, limit, skip, take } = getPaginationParams(req.query.page, req.query.limit);
      const { search, category_id, is_featured, is_active, min_price, max_price, in_stock } = req.query;

      // Build where clause
      const where = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category_id) {
        where.category_id = category_id;
      }

      if (is_featured !== undefined) {
        where.is_featured = is_featured === 'true';
      }

      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      if (min_price || max_price) {
        where.price = {};
        if (min_price) where.price.gte = parseFloat(min_price);
        if (max_price) where.price.lte = parseFloat(max_price);
      }

      if (in_stock === 'true') {
        where.stock = { gt: 0 };
      }

      // Get products with pagination
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take,
          orderBy: { created_at: 'desc' },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            creator: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      const pagination = getPaginationMeta(page, limit, total);

      return res.status(200).json({
        success: true,
        data: products,
        pagination,
      });
    } catch (error) {
      console.error('Get products error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message,
      });
    }
  }

  /**
   * Get Product by ID
   */
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          creator: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
            },
          },
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Calculate average rating
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0;

      return res.status(200).json({
        success: true,
        data: {
          ...product,
          average_rating: avgRating.toFixed(1),
          review_count: product.reviews.length,
        },
      });
    } catch (error) {
      console.error('Get product error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error.message,
      });
    }
  }

  /**
   * Update Product with Image Management
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        price,
        discount_price,
        stock,
        category_id,
        sku,
        sizes,
        colors,
        weight,
        is_featured,
        is_active,
        remove_images, // Array of image URLs to remove
      } = req.validatedBody;

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Check if category exists (if provided)
      if (category_id) {
        const category = await prisma.category.findUnique({
          where: { id: category_id },
        });

        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Category not found',
          });
        }
      }

      // Check SKU uniqueness (if changed)
      if (sku && sku !== existingProduct.sku) {
        const skuExists = await prisma.product.findUnique({
          where: { sku },
        });

        if (skuExists) {
          return res.status(400).json({
            success: false,
            message: 'SKU already exists',
          });
        }
      }

      // Handle image updates
      let currentImages = existingProduct.images || [];

      // Remove specified images
      if (remove_images && Array.isArray(remove_images)) {
        const imagesToRemove = typeof remove_images === 'string' ? JSON.parse(remove_images) : remove_images;
        
        // Delete from Supabase Storage
        for (const imageUrl of imagesToRemove) {
          try {
            const path = imageUrl.split('/').slice(-2).join('/'); // Extract path from URL
            await deleteFromSupabase(path, process.env.SUPABASE_STORAGE_BUCKET_PRODUCTS || 'products');
          } catch (deleteError) {
            console.error('Failed to delete image:', deleteError);
          }
        }

        currentImages = currentImages.filter((img) => !imagesToRemove.includes(img));
      }

      // Upload new images
      if (req.files && req.files.length > 0) {
        try {
          const uploadResults = await uploadMultipleToSupabase(
            req.files,
            process.env.SUPABASE_STORAGE_BUCKET_PRODUCTS || 'products',
            'products'
          );
          const newImageUrls = uploadResults.map((result) => result.publicUrl);
          currentImages = [...currentImages, ...newImageUrls];
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload new images',
            error: uploadError.message,
          });
        }
      }

      // Build update data
      const updateData = {
        updated_at: new Date(),
      };

      if (name !== undefined) {
        updateData.name = name;
        updateData.slug = await generateUniqueSlug(name, async (slug) => {
          const existing = await prisma.product.findUnique({ where: { slug } });
          return existing && existing.id !== id ? true : false;
        });
      }
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (discount_price !== undefined) updateData.discount_price = discount_price ? parseFloat(discount_price) : null;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (category_id !== undefined) updateData.category_id = category_id;
      if (sku !== undefined) updateData.sku = sku;
      if (sizes !== undefined) updateData.sizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
      if (colors !== undefined) updateData.colors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
      if (is_featured !== undefined) updateData.is_featured = is_featured === 'true' || is_featured === true;
      if (is_active !== undefined) updateData.is_active = is_active === 'true' || is_active === true;
      
      updateData.images = currentImages;

      // Update product
      const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      console.error('Update product error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message,
      });
    }
  }

  /**
   * Delete Product
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          cart_items: true,
          order_items: true,
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Check if product is in any orders
      if (product.order_items.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete product. It has associated orders.',
        });
      }

      // Delete images from Supabase Storage
      if (product.images && Array.isArray(product.images)) {
        for (const imageUrl of product.images) {
          try {
            const path = imageUrl.split('/').slice(-2).join('/');
            await deleteFromSupabase(path, process.env.SUPABASE_STORAGE_BUCKET_PRODUCTS || 'products');
          } catch (deleteError) {
            console.error('Failed to delete image:', deleteError);
          }
        }
      }

      // Delete product (cascade will delete cart_items)
      await prisma.product.delete({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Delete product error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message,
      });
    }
  }

  /**
   * Update Stock
   */
  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { stock } = req.validatedBody;

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Update stock
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          stock: parseInt(stock),
          updated_at: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Stock updated successfully',
        data: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          stock: updatedProduct.stock,
        },
      });
    } catch (error) {
      console.error('Update stock error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update stock',
        error: error.message,
      });
    }
  }

  /**
   * Toggle Featured Status
   */
  async toggleFeatured(req, res) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          is_featured: !product.is_featured,
          updated_at: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: `Product ${updatedProduct.is_featured ? 'featured' : 'unfeatured'} successfully`,
        data: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          is_featured: updatedProduct.is_featured,
        },
      });
    } catch (error) {
      console.error('Toggle featured error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to toggle featured status',
        error: error.message,
      });
    }
  }
}

module.exports = new ProductController();
