const { supabaseAdmin } = require('../config/supabase');
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();

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
 * Upload single file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - Original filename
 * @param {string} bucket - Storage bucket name
 * @param {string} folder - Folder path in bucket (optional)
 * @returns {Promise<object>} Upload result with public URL
 */
async function uploadToSupabase(fileBuffer, fileName, bucket, folder = '') {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const uniqueFileName = `${baseName}-${timestamp}${ext}`;
    const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: 'image/jpeg', // Adjust based on file type
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      path: data.path,
      publicUrl,
      fileName: uniqueFileName,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param {Array} files - Array of file objects from multer
 * @param {string} bucket - Storage bucket name
 * @param {string} folder - Folder path in bucket (optional)
 * @returns {Promise<Array>} Array of upload results
 */
async function uploadMultipleToSupabase(files, bucket, folder = '') {
  try {
    const uploadPromises = files.map((file) =>
      uploadToSupabase(file.buffer, file.originalname, bucket, folder)
    );

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error(`Failed to upload files: ${error.message}`);
  }
}

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - Path to file in bucket
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<boolean>} Success status
 */
async function deleteFromSupabase(filePath, bucket) {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple files from Supabase Storage
 * @param {Array<string>} filePaths - Array of file paths
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<boolean>} Success status
 */
async function deleteMultipleFromSupabase(filePaths, bucket) {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove(filePaths);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Multiple delete error:', error);
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

module.exports = {
  upload,
  uploadToSupabase,
  uploadMultipleToSupabase,
  deleteFromSupabase,
  deleteMultipleFromSupabase,
};
