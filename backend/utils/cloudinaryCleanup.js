/**
 * cloudinaryCleanup.js — fire-and-forget Cloudinary image cleanup.
 * Extracts the public_id from a Cloudinary URL and deletes the asset.
 * Failures are silently logged — post deletion should never fail
 * because of a Cloudinary cleanup issue.
 */
const cloudinary = require('../config/cloudinary');

/**
 * Extract Cloudinary public_id from a secure URL.
 * Example: "https://res.cloudinary.com/<cloud>/image/upload/v123/alumni/posts/abc123.webp"
 *   → "alumni/posts/abc123"
 */
const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    // Remove version prefix (v123456789/) and file extension
    const afterUpload = parts[1].replace(/^v\d+\//, '');
    return afterUpload.replace(/\.[^.]+$/, ''); // strip .webp / .jpg / .png etc.
  } catch {
    return null;
  }
};

/**
 * Delete a Cloudinary image by URL.  Fire-and-forget.
 * @param {string} url — full Cloudinary secure URL
 */
const deleteCloudinaryImage = async (url) => {
  const publicId = extractPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`[Cloudinary Cleanup] Failed to delete ${publicId}:`, err.message);
  }
};

module.exports = { deleteCloudinaryImage, extractPublicId };
