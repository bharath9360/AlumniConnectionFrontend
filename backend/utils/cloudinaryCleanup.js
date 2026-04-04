/**
 * cloudinaryCleanup.js — fire-and-forget Cloudinary image cleanup.
 * Extracts the public_id from a Cloudinary URL and deletes the asset.
 * Failures are silently logged — post deletion should never fail
 * because of a Cloudinary cleanup issue.
 */
const cloudinary = require('../config/cloudinary');
const { stripTransforms } = require('./cloudinaryUrl');

/**
 * Extract Cloudinary public_id from a secure URL.
 * Strips CDN transformation params (e.g. f_auto,q_auto) before parsing
 * so deletion works for both raw and CDN-optimised URLs.
 *
 * Example: "https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/v123/alumni/posts/abc123.webp"
 *   → "alumni/posts/abc123"
 */
const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    // Strip any injected CDN transformation params before extracting public_id
    const cleanUrl = stripTransforms(url);
    const parts = cleanUrl.split('/upload/');
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
 * Works for both raw Cloudinary URLs and CDN-transform-injected URLs.
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
