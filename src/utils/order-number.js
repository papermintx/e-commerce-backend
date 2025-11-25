/**
 * Generate unique order number
 * Format: ORD-YYYYMMDD-XXX
 * Example: ORD-20251125-001
 * @param {number} counter - Sequential counter for the day
 * @returns {string} Generated order number
 */
function generateOrderNumber(counter = 1) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const sequence = String(counter).padStart(3, '0');

  return `ORD-${year}${month}${day}-${sequence}`;
}

/**
 * Generate unique order number by checking database
 * @param {Function} checkExists - Async function to check if order number exists
 * @returns {Promise<string>} Unique order number
 */
async function generateUniqueOrderNumber(checkExists) {
  let counter = 1;
  let orderNumber;
  let exists = true;

  // Keep trying until we find a unique order number
  while (exists) {
    orderNumber = generateOrderNumber(counter);
    exists = await checkExists(orderNumber);
    counter++;
  }

  return orderNumber;
}

module.exports = {
  generateOrderNumber,
  generateUniqueOrderNumber,
};
