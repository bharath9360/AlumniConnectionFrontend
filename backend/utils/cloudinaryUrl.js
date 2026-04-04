/**
 * cloudinaryUrl.js — CDN URL transformation helpers.
 *
 * Injects `f_auto,q_auto` into any Cloudinary upload URL so the CDN
 * automatically serves the best format (WebP/AVIF) at the optimal quality
 * for each browser/device.  Non-Cloudinary URLs are returned unchanged.
 *
 * IMPORTANT: does NOT mutate existing URL structures — only inserts
 * transformation params into the `/upload/` segment.
 */

const CLOUDINARY_UPLOAD_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.*|[^v].*)$/;

/**
 * Inject f_auto,q_auto CDN params into a Cloudinary image URL.
 *
 * Before: https://res.cloudinary.com/abc/image/upload/v123/alumni/posts/img.jpg
 * After:  https://res.cloudinary.com/abc/image/upload/f_auto,q_auto/v123/alumni/posts/img.jpg
 *
 * Already-transformed URLs (containing "f_auto" or "q_auto") are left as-is.
 *
 * @param {string} url  — raw Cloudinary URL or any other URL
 * @returns {string}    — CDN-optimised URL
 */
const injectCdnParams = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;       // not a Cloudinary URL
  if (url.includes('f_auto') || url.includes('q_auto')) return url; // already optimised

  // Insert f_auto,q_auto right after /upload/
  return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
};

/**
 * Strip CDN transformation params for public_id extraction
 * (used by cloudinaryCleanup.js — transformations must be removed first).
 *
 * @param {string} url  — Cloudinary URL (may contain transforms)
 * @returns {string}    — URL with transforms removed
 */
const stripTransforms = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Remove everything between /upload/ and the version/folder segment
  return url.replace(/\/image\/upload\/[^/]+(?:\/[^/]+)*?(?=\/v\d+\/|\/[a-zA-Z])/, '/image/upload/');
};

module.exports = { injectCdnParams, stripTransforms };
