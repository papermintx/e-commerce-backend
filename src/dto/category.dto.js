/**
 * Validate Create Category DTO
 */
function validateCreateCategoryDto(data) {
  const errors = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string');
  } else if (data.name.length < 2 || data.name.length > 50) {
    errors.push('Name must be between 2 and 50 characters');
  }

  // Description validation (optional)
  if (data.description && typeof data.description !== 'string') {
    errors.push('Description must be a string');
  } else if (data.description && data.description.length > 500) {
    errors.push('Description must not exceed 500 characters');
  }

  // Image URL validation (optional)
  if (data.image_url && typeof data.image_url !== 'string') {
    errors.push('Image URL must be a string');
  } else if (data.image_url && data.image_url.length > 500) {
    errors.push('Image URL must not exceed 500 characters');
  }

  // is_active validation (optional, defaults to true)
  if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return errors;
}

/**
 * Validate Update Category DTO
 */
function validateUpdateCategoryDto(data) {
  const errors = [];

  // All fields are optional for update
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('Name must be a string');
    } else if (data.name.length < 2 || data.name.length > 50) {
      errors.push('Name must be between 2 and 50 characters');
    }
  }

  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
  }

  if (data.image_url !== undefined && data.image_url !== null) {
    if (typeof data.image_url !== 'string') {
      errors.push('Image URL must be a string');
    } else if (data.image_url.length > 500) {
      errors.push('Image URL must not exceed 500 characters');
    }
  }

  if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  return errors;
}

module.exports = {
  validateCreateCategoryDto,
  validateUpdateCategoryDto,
};
