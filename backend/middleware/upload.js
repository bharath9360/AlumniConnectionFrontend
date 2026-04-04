const multer  = require('multer');
const sharp   = require('sharp');
const cloudinary = require('../config/cloudinary');
const { injectCdnParams } = require('../utils/cloudinaryUrl');

// Use memory storage — files go to Cloudinary, not disk
const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed.'), false);
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) return cb(null, true);
  cb(new Error('Only video files are allowed.'), false);
};

const mediaFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/')) return cb(null, true);
  cb(new Error('Only image or video files are allowed.'), false);
};

// Multer instances — memory only, no disk
// Accept up to 15 MB since we compress before Cloudinary
const postUpload    = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 }, fileFilter: mediaFilter });
const profileUpload = multer({ storage, limits: { fileSize: 3  * 1024 * 1024 }, fileFilter: imageFilter });
const bannerUpload  = multer({ storage, limits: { fileSize: 5  * 1024 * 1024 }, fileFilter: imageFilter });
const videoUpload   = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: videoFilter });

// ─── Sharp Image Optimization ────────────────────────────────────
// Compresses images > 300 KB before upload to Cloudinary.
// If sharp fails for any reason, returns the original buffer (no crash).
const COMPRESSION_THRESHOLD = 300 * 1024; // 300 KB

const optimizeImage = async (fileBuffer) => {
  try {
    // Skip compression for small images
    if (fileBuffer.length <= COMPRESSION_THRESHOLD) {
      return fileBuffer;
    }
    return await sharp(fileBuffer)
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
  } catch (err) {
    // Fallback: return original buffer if sharp fails
    console.warn('[Sharp] Image optimization failed, using original:', err.message);
    return fileBuffer;
  }
};

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - file buffer from multer memoryStorage
 * @param {string} folder - Cloudinary folder name
 * @param {string} resourceType - 'image' or 'video'
 * @param {Object} transforms - optional Cloudinary transformations
 * @returns {Promise<string>} - secure HTTPS URL
 */
const uploadToCloudinary = (buffer, folder, resourceType = 'image', transforms = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      ...transforms
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        // Inject f_auto,q_auto CDN params for optimal format delivery
        resolve(injectCdnParams(result.secure_url));
      }
    );

    stream.end(buffer);
  });
};

/**
 * Optimize an image with Sharp, then upload to Cloudinary.
 * For videos, skips optimization and uploads directly.
 * @param {Buffer} buffer - file buffer
 * @param {string} folder - Cloudinary folder
 * @param {string} resourceType - 'image' or 'video'
 * @param {Object} transforms - Cloudinary transformations
 * @returns {Promise<{ url: string, optimized: boolean }>}
 */
const uploadOptimized = async (buffer, folder, resourceType = 'image', transforms = {}) => {
  let finalBuffer = buffer;
  let optimized = false;

  if (resourceType === 'image') {
    const origSize = buffer.length;
    finalBuffer = await optimizeImage(buffer);
    optimized = finalBuffer.length < origSize;
  }

  const url = await uploadToCloudinary(finalBuffer, folder, resourceType, transforms);
  return { url, optimized };
};

module.exports = {
  postUpload,
  profileUpload,
  bannerUpload,
  videoUpload,
  uploadToCloudinary,
  uploadOptimized,
  optimizeImage,
};
