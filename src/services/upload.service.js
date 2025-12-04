const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(path.join(UPLOAD_DIR, 'products'), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_DIR, 'categories'), { recursive: true });
    await fs.mkdir(path.join(UPLOAD_DIR, 'avatars'), { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
};
ensureUploadDir();

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const folder = req.uploadFolder || 'products'; // Default to products
    const uploadPath = path.join(UPLOAD_DIR, folder);
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const uniqueFileName = `${baseName}-${timestamp}${ext}`;
    cb(null, uniqueFileName);
  },
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * Get public URL for uploaded file
 * @param {string} filePath - Relative file path
 * @returns {string} Public URL
 */
function getPublicUrl(filePath) {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${filePath}`;
}

/**
 * Upload file result formatter
 * File sudah diupload oleh multer, kita hanya perlu format response
 * @param {object} file - File object from multer
 * @param {string} folder - Folder name
 * @returns {object} Upload result with public URL
 */
function formatUploadResult(file, folder = 'products') {
  const relativePath = `${folder}/${file.filename}`;
  return {
    success: true,
    path: relativePath,
    publicUrl: getPublicUrl(relativePath),
    fileName: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  };
}

/**
 * Format multiple upload results
 * @param {Array} files - Array of file objects from multer
 * @param {string} folder - Folder name
 * @returns {Array} Array of upload results
 */
function formatMultipleUploadResults(files, folder = 'products') {
  return files.map((file) => formatUploadResult(file, folder));
}

/**
 * Delete file from local storage
 * @param {string} filePath - Relative file path (e.g., 'products/image-123.jpg')
 * @returns {Promise<boolean>} Success status
 */
async function deleteFile(filePath) {
  try {
    const fullPath = path.join(UPLOAD_DIR, filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    if (error.code === 'ENOENT') {
      // File doesn't exist, consider it deleted
      return true;
    }
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple files from local storage
 * @param {Array<string>} filePaths - Array of relative file paths
 * @returns {Promise<boolean>} Success status
 */
async function deleteMultipleFiles(filePaths) {
  try {
    const deletePromises = filePaths.map((filePath) => deleteFile(filePath));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Multiple delete error:', error);
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

/**
 * Extract file path from public URL
 * @param {string} publicUrl - Public URL of the file
 * @returns {string|null} Relative file path or null
 */
function extractFilePathFromUrl(publicUrl) {
  try {
    // Extract path from URL like "http://localhost:3000/uploads/products/image-123.jpg"
    const match = publicUrl.match(/\/uploads\/(.+)$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Extract path error:', error);
    return null;
  }
}

module.exports = {
  upload,
  formatUploadResult,
  formatMultipleUploadResults,
  deleteFile,
  deleteMultipleFiles,
  getPublicUrl,
  extractFilePathFromUrl,
  UPLOAD_DIR,
};
