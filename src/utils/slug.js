/**
 * Generate URL-friendly slug from string
 * @param {string} text - Text to convert to slug
 * @returns {string} Generated slug
 */
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Generate unique slug by adding suffix if needed
 * @param {string} text - Text to convert to slug
 * @param {Function} checkExists - Async function to check if slug exists
 * @returns {Promise<string>} Unique slug
 */
async function generateUniqueSlug(text, checkExists) {
  let slug = generateSlug(text);
  let counter = 1;
  let uniqueSlug = slug;

  // Keep trying until we find a unique slug
  while (await checkExists(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

module.exports = {
  generateSlug,
  generateUniqueSlug,
};
