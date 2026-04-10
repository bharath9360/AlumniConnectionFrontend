const express = require('express');
const Legal = require('../models/Legal');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

/**
 * Fallback default content templates if DB is empty
 */
const fallbacks = {
  privacy: {
    title: 'Privacy Policy',
    content: '<h2>Privacy Policy</h2><p>This is the default privacy policy. The administration is currently updating this document.</p>'
  },
  terms: {
    title: 'Terms & Conditions',
    content: '<h2>Terms & Conditions</h2><p>This is the default terms and conditions document.</p>'
  },
  security: {
    title: 'Security',
    content: '<h2>Security Policy</h2><p>We take your data security seriously.</p>'
  }
};

// ─── GET /api/legal/:type (Public Route) ──────────────────────
router.get('/:type', asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  
  if (!['privacy', 'terms', 'security'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid document type' });
  }

  let doc = await Legal.findOne({ type });

  // Use fallback if not found in db
  if (!doc) {
    doc = {
      type,
      title: fallbacks[type].title,
      content: fallbacks[type].content,
      lastUpdated: new Date()
    };
  }

  res.json({ success: true, data: doc });
}));

// ─── POST /api/legal/admin/:type (Admin Only - Upsert) ────────
router.post('/admin/:type', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const { title, content } = req.body;

  if (!['privacy', 'terms', 'security'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid document type' });
  }

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required' });
  }

  const doc = await Legal.findOneAndUpdate(
    { type },
    { 
      title, 
      content,
      updatedBy: req.user._id,
      lastUpdated: new Date()
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, data: doc, message: `${title} updated successfully.` });
}));

module.exports = router;
