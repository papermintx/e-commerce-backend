/**
 * Validate Create Product DTO
 * Supports both JSON and form-data (multipart) formats
 */
function validateCreateProductDto(data) {
  const errors = [];

  // Convert form-data string values to proper types
  const price = data.price ? parseFloat(data.price) : undefined;
  const discount_price = data.discount_price ? parseFloat(data.discount_price) : undefined;
  const stock = data.stock ? parseInt(data.stock) : undefined;
  const weight = data.weight ? parseFloat(data.weight) : undefined;
  
  // Parse JSON strings for arrays (from form-data)
  let sizes = data.sizes;
  if (typeof sizes === 'string') {
    try {
      sizes = JSON.parse(sizes);
    } catch (e) {
      errors.push('Sizes must be a valid JSON array');
      sizes = undefined;
    }
  }
  
  let colors = data.colors;
  if (typeof colors === 'string') {
    try {
      colors = JSON.parse(colors);
    } catch (e) {
      errors.push('Colors must be a valid JSON array');
      colors = undefined;
    }
  }

  // Convert boolean strings to boolean
  let is_featured = data.is_featured;
  if (typeof is_featured === 'string') {
    is_featured = is_featured === 'true';
  }

  let is_active = data.is_active;
  if (typeof is_active === 'string') {
    is_active = is_active === 'true';
  }

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string');
  } else if (data.name.length < 3 || data.name.length > 200) {
    errors.push('Name must be between 3 and 200 characters');
  }

  // Description validation
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Description is required and must be a string');
  } else if (data.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  // Price validation
  if (!price || isNaN(price)) {
    errors.push('Price is required and must be a valid number');
  } else if (price <= 0) {
    errors.push('Price must be greater than 0');
  }

  // Discount price validation (optional)
  if (data.discount_price !== undefined && data.discount_price !== null && data.discount_price !== '') {
    if (isNaN(discount_price)) {
      errors.push('Discount price must be a valid number');
    } else if (discount_price < 0) {
      errors.push('Discount price must be 0 or greater');
    } else if (price && discount_price >= price) {
      errors.push('Discount price must be less than regular price');
    }
  }

  // Stock validation
  if (stock === undefined || isNaN(stock)) {
    errors.push('Stock is required and must be a valid number');
  } else if (stock < 0) {
    errors.push('Stock cannot be negative');
  } else if (!Number.isInteger(stock)) {
    errors.push('Stock must be an integer');
  }

  // Category ID validation
  if (!data.category_id || typeof data.category_id !== 'string') {
    errors.push('Category ID is required and must be a string');
  }

  // SKU validation
  if (!data.sku || typeof data.sku !== 'string') {
    errors.push('SKU is required and must be a string');
  } else if (data.sku.length < 3 || data.sku.length > 50) {
    errors.push('SKU must be between 3 and 50 characters');
  }

  // Sizes validation (optional, must be array of strings)
  if (sizes !== undefined && sizes !== null) {
    if (!Array.isArray(sizes)) {
      errors.push('Sizes must be an array');
    } else if (sizes.length > 0 && !sizes.every(size => typeof size === 'string')) {
      errors.push('All sizes must be strings');
    }
  }

  // Colors validation (optional, must be array of strings)
  if (colors !== undefined && colors !== null) {
    if (!Array.isArray(colors)) {
      errors.push('Colors must be an array');
    } else if (colors.length > 0 && !colors.every(color => typeof color === 'string')) {
      errors.push('All colors must be strings');
    }
  }

  // Weight validation (optional)
  if (data.weight !== undefined && data.weight !== null && data.weight !== '') {
    if (isNaN(weight)) {
      errors.push('Weight must be a valid number');
    } else if (weight <= 0) {
      errors.push('Weight must be greater than 0');
    }
  }

  // is_featured validation (optional)
  if (data.is_featured !== undefined && typeof is_featured !== 'boolean') {
    errors.push('is_featured must be a boolean');
  }

  // is_active validation (optional)
  if (data.is_active !== undefined && typeof is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  // is_active validation (optional)
  if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return errors;
}

/**
 * Validate Update Product DTO
 */
function validateUpdateProductDto(data) {
  const errors = [];

  // Parse form-data values (all fields optional for update)
  let price = data.price;
  let discount_price = data.discount_price;
  let stock = data.stock;
  let weight = data.weight;
  let sizes = data.sizes;
  let colors = data.colors;
  let images = data.images;
  let is_featured = data.is_featured;
  let is_active = data.is_active;

  // Parse numeric strings from form-data
  if (data.price !== undefined && typeof data.price === 'string') {
    price = parseFloat(data.price);
  }
  if (data.discount_price !== undefined && typeof data.discount_price === 'string') {
    discount_price = parseFloat(data.discount_price);
  }
  if (data.stock !== undefined && typeof data.stock === 'string') {
    stock = parseInt(data.stock, 10);
  }
  if (data.weight !== undefined && typeof data.weight === 'string') {
    weight = parseFloat(data.weight);
  }

  // Parse JSON array strings from form-data
  if (data.sizes !== undefined && typeof data.sizes === 'string') {
    try {
      sizes = JSON.parse(data.sizes);
    } catch (e) {
      errors.push('Sizes must be a valid JSON array');
    }
  }
  if (data.colors !== undefined && typeof data.colors === 'string') {
    try {
      colors = JSON.parse(data.colors);
    } catch (e) {
      errors.push('Colors must be a valid JSON array');
    }
  }
  if (data.images !== undefined && typeof data.images === 'string') {
    try {
      images = JSON.parse(data.images);
    } catch (e) {
      errors.push('Images must be a valid JSON array');
    }
  }

  // Parse boolean strings from form-data
  if (data.is_featured !== undefined && typeof data.is_featured === 'string') {
    is_featured = data.is_featured === 'true';
  }
  if (data.is_active !== undefined && typeof data.is_active === 'string') {
    is_active = data.is_active === 'true';
  }

  // Validation (all fields optional)
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('Name must be a string');
    } else if (data.name.length < 3 || data.name.length > 200) {
      errors.push('Name must be between 3 and 200 characters');
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length < 10) {
      errors.push('Description must be at least 10 characters');
    }
  }

  if (data.price !== undefined) {
    if (isNaN(price)) {
      errors.push('Price must be a valid number');
    } else if (price <= 0) {
      errors.push('Price must be greater than 0');
    }
  }

  if (data.discount_price !== undefined && data.discount_price !== null) {
    if (isNaN(discount_price)) {
      errors.push('Discount price must be a valid number');
    } else if (discount_price < 0) {
      errors.push('Discount price must be 0 or greater');
    }
  }

  if (data.stock !== undefined) {
    if (isNaN(stock)) {
      errors.push('Stock must be a valid number');
    } else if (stock < 0) {
      errors.push('Stock cannot be negative');
    } else if (!Number.isInteger(stock)) {
      errors.push('Stock must be an integer');
    }
  }

  if (data.category_id !== undefined && typeof data.category_id !== 'string') {
    errors.push('Category ID must be a string');
  }

  if (data.sku !== undefined) {
    if (typeof data.sku !== 'string') {
      errors.push('SKU must be a string');
    } else if (data.sku.length < 3 || data.sku.length > 50) {
      errors.push('SKU must be between 3 and 50 characters');
    }
  }

  if (data.images !== undefined) {
    if (!Array.isArray(images)) {
      errors.push('Images must be an array');
    } else if (images.length > 0 && !images.every(img => typeof img === 'string')) {
      errors.push('All images must be strings (URLs)');
    }
  }

  if (data.sizes !== undefined) {
    if (!Array.isArray(sizes)) {
      errors.push('Sizes must be an array');
    } else if (sizes.length > 0 && !sizes.every(size => typeof size === 'string')) {
      errors.push('All sizes must be strings');
    }
  }

  if (data.colors !== undefined) {
    if (!Array.isArray(colors)) {
      errors.push('Colors must be an array');
    } else if (colors.length > 0 && !colors.every(color => typeof color === 'string')) {
      errors.push('All colors must be strings');
    }
  }

  if (data.weight !== undefined && data.weight !== null) {
    if (isNaN(weight)) {
      errors.push('Weight must be a valid number');
    } else if (weight <= 0) {
      errors.push('Weight must be greater than 0');
    }
  }

  if (data.is_featured !== undefined && typeof is_featured !== 'boolean') {
    errors.push('is_featured must be a boolean');
  }

  if (data.is_active !== undefined && typeof is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return errors;
}

/**
 * Validate Update Stock DTO
 */
function validateUpdateStockDto(data) {
  const errors = [];

  if (data.stock === undefined || typeof data.stock !== 'number') {
    errors.push('Stock is required and must be a number');
  } else if (data.stock < 0) {
    errors.push('Stock cannot be negative');
  } else if (!Number.isInteger(data.stock)) {
    errors.push('Stock must be an integer');
  }

  return errors;
}

module.exports = {
  validateCreateProductDto,
  validateUpdateProductDto,
  validateUpdateStockDto,
};
