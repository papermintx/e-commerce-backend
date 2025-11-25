/**
 * Calculate pagination metadata
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {object} Pagination metadata
 */
function getPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
}

/**
 * Get Prisma skip and take values for pagination
 * @param {number} page - Current page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {object} { skip, take }
 */
function getPaginationParams(page = 1, limit = 10) {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  // Ensure minimum values
  const validPage = Math.max(1, pageNum);
  const validLimit = Math.min(Math.max(1, limitNum), 100); // Max 100 items per page

  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
    page: validPage,
    limit: validLimit,
  };
}

module.exports = {
  getPaginationMeta,
  getPaginationParams,
};
