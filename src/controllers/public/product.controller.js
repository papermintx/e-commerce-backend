const prisma = require('../../config/prisma');
const { getPaginationParams, getPaginationMeta } = require('../../utils/pagination');

class PublicProductController {
  /**
   * Get All Products (Public)
   * For displaying in shop page with carousel images
   */
  async getAllProducts(req, res) {
    try {
      const { page, limit, skip, take } = getPaginationParams(req.query.page, req.query.limit);
      const { search, category_id, category_slug, min_price, max_price, sort, is_featured } = req.query;

      // Build where clause - only show active products
      const where = {
        is_active: true,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category_id) {
        where.category_id = category_id;
      }

      if (category_slug) {
        const category = await prisma.category.findUnique({
          where: { slug: category_slug },
        });
        if (category) {
          where.category_id = category.id;
        }
      }

      if (is_featured === 'true') {
        where.is_featured = true;
      }

      if (min_price || max_price) {
        where.price = {};
        if (min_price) where.price.gte = parseFloat(min_price);
        if (max_price) where.price.lte = parseFloat(max_price);
      }

      // Only show products in stock
      where.stock = { gt: 0 };

      // Build order by
      let orderBy = { created_at: 'desc' };
      if (sort === 'price_asc') orderBy = { price: 'asc' };
      if (sort === 'price_desc') orderBy = { price: 'desc' };
      if (sort === 'name_asc') orderBy = { name: 'asc' };
      if (sort === 'name_desc') orderBy = { name: 'desc' };

      // Get products with pagination
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take,
          orderBy,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            discount_price: true,
            stock: true,
            sku: true,
            images: true, // Array of images for carousel
            sizes: true,
            colors: true,
            is_featured: true,
            created_at: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      // Add average rating to each product
      const productsWithRating = products.map((product) => {
        const avgRating =
          product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
            : 0;

        return {
          ...product,
          average_rating: parseFloat(avgRating.toFixed(1)),
          review_count: product.reviews.length,
          // Don't send reviews array to frontend
          reviews: undefined,
        };
      });

      const pagination = getPaginationMeta(page, limit, total);

      return res.status(200).json({
        success: true,
        data: productsWithRating,
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
   * Get Product by Slug (Public)
   * For product detail page with full carousel
   */
  async getProductBySlug(req, res) {
    try {
      const { slug } = req.params;

      const product = await prisma.product.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          discount_price: true,
          stock: true,
          sku: true,
          images: true, // Full array of images for carousel
          sizes: true,
          colors: true,
          weight: true,
          is_featured: true,
          created_at: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              created_at: true,
              profile: {
                select: {
                  full_name: true,
                  avatar_url: true,
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
            take: 10, // Latest 10 reviews
          },
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      if (!product.is_active) {
        return res.status(404).json({
          success: false,
          message: 'Product is not available',
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
          average_rating: parseFloat(avgRating.toFixed(1)),
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
   * Get Featured Products (Public)
   * For homepage carousel/slider
   */
  async getFeaturedProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const products = await prisma.product.findMany({
        where: {
          is_featured: true,
          is_active: true,
          stock: { gt: 0 },
        },
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          discount_price: true,
          stock: true,
          images: true, // All images for carousel
          is_featured: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      // Add average rating
      const productsWithRating = products.map((product) => {
        const avgRating =
          product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
            : 0;

        return {
          ...product,
          average_rating: parseFloat(avgRating.toFixed(1)),
          review_count: product.reviews.length,
          reviews: undefined,
        };
      });

      return res.status(200).json({
        success: true,
        data: productsWithRating,
      });
    } catch (error) {
      console.error('Get featured products error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch featured products',
        error: error.message,
      });
    }
  }

  /**
   * Get Related Products (Public)
   * For product detail page - same category
   */
  async getRelatedProducts(req, res) {
    try {
      const { slug } = req.params;
      const limit = parseInt(req.query.limit) || 4;

      // Get current product
      const currentProduct = await prisma.product.findUnique({
        where: { slug },
        select: { id: true, category_id: true },
      });

      if (!currentProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Get related products from same category
      const products = await prisma.product.findMany({
        where: {
          category_id: currentProduct.category_id,
          id: { not: currentProduct.id }, // Exclude current product
          is_active: true,
          stock: { gt: 0 },
        },
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          discount_price: true,
          images: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      // Add average rating
      const productsWithRating = products.map((product) => {
        const avgRating =
          product.reviews.length > 0
            ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
            : 0;

        return {
          ...product,
          average_rating: parseFloat(avgRating.toFixed(1)),
          review_count: product.reviews.length,
          reviews: undefined,
        };
      });

      return res.status(200).json({
        success: true,
        data: productsWithRating,
      });
    } catch (error) {
      console.error('Get related products error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch related products',
        error: error.message,
      });
    }
  }
}

module.exports = new PublicProductController();
