const multer  = require('multer');
const cloudinary = require('../config/cloudinary');

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
const postUpload    = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: mediaFilter });
const profileUpload = multer({ storage, limits: { fileSize: 3  * 1024 * 1024 }, fileFilter: imageFilter });
const bannerUpload  = multer({ storage, limits: { fileSize: 5  * 1024 * 1024 }, fileFilter: imageFilter });
const videoUpload   = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: videoFilter });

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
        resolve(result.secure_url); // Always HTTPS
      }
    );

    stream.end(buffer);
  });
};

module.exports = {
  postUpload,
  profileUpload,
  bannerUpload,
  videoUpload,
  uploadToCloudinary
};
