const express  = require('express');
const crypto   = require('crypto');
const LandingPage = require('../models/LandingPage');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const ADMIN  = [protect, authorize('admin')];

// ── Helpers ────────────────────────────────────────────────────
const getDoc = () => LandingPage.getOrCreate();

// ══════════════════════════════════════════════════════════════
//  PUBLIC — read-only (used by the actual landing page)
// ══════════════════════════════════════════════════════════════

// GET /api/landing  — all visible sections sorted by order
router.get('/', async (req, res) => {
  try {
    const doc = await getDoc();
    const sections = doc.sections
      .filter(s => s.isVisible)
      .sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sections });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load landing page.' });
  }
});

// ══════════════════════════════════════════════════════════════
//  ADMIN — full CRUD + reorder
// ══════════════════════════════════════════════════════════════

// GET /api/landing/admin  — all sections (incl. hidden), sorted
router.get('/admin', ...ADMIN, async (req, res) => {
  try {
    const doc = await getDoc();
    const sections = [...doc.sections].sort((a, b) => a.order - b.order);
    res.json({ success: true, data: sections, updatedAt: doc.updatedAt });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load CMS data.' });
  }
});

// ─── POST /api/landing/admin/sections — add new section ───────
router.post('/admin/sections', ...ADMIN, async (req, res) => {
  try {
    const { sectionType = 'custom', label, icon = '📄', fields = [], items = [] } = req.body;
    if (!label?.trim()) return res.status(400).json({ message: 'Label is required.' });

    const doc = await getDoc();
    const maxOrder = doc.sections.reduce((m, s) => Math.max(m, s.order), -1);

    const newSection = {
      sectionKey:  `custom_${crypto.randomUUID().slice(0, 8)}`,
      sectionType,
      label:       label.trim(),
      icon,
      order:       maxOrder + 1,
      isVisible:   true,
      fields:      fields.map(f => ({ ...f, value: f.value || '' })),
      items,
    };

    doc.sections.push(newSection);
    doc.updatedAt = new Date();
    await doc.save();

    const created = doc.sections[doc.sections.length - 1];
    res.status(201).json({ success: true, message: 'Section created.', data: created });
  } catch (err) {
    console.error('[POST /landing/admin/sections]', err);
    res.status(500).json({ message: 'Failed to create section.' });
  }
});

// ─── PUT /api/landing/admin/sections/:key — update section ────
router.put('/admin/sections/:key', ...ADMIN, async (req, res) => {
  try {
    const doc = await getDoc();
    const sec = doc.sections.find(s => s.sectionKey === req.params.key);
    if (!sec) return res.status(404).json({ message: 'Section not found.' });

    const { label, icon, isVisible, fields, items } = req.body;
    if (label     !== undefined) sec.label     = label;
    if (icon      !== undefined) sec.icon      = icon;
    if (isVisible !== undefined) sec.isVisible = isVisible;
    if (fields    !== undefined) sec.fields    = fields;
    if (items     !== undefined) sec.items     = items;

    doc.updatedAt = new Date();
    await doc.save();

    res.json({ success: true, message: 'Section updated.', data: sec });
  } catch (err) {
    console.error('[PUT /landing/admin/sections/:key]', err);
    res.status(500).json({ message: 'Failed to update section.' });
  }
});

// ─── DELETE /api/landing/admin/sections/:key ──────────────────
router.delete('/admin/sections/:key', ...ADMIN, async (req, res) => {
  try {
    const doc = await getDoc();
    const idx = doc.sections.findIndex(s => s.sectionKey === req.params.key);
    if (idx === -1) return res.status(404).json({ message: 'Section not found.' });

    const [removed] = doc.sections.splice(idx, 1);
    doc.updatedAt = new Date();
    await doc.save();

    res.json({ success: true, message: `Section "${removed.label}" deleted.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete section.' });
  }
});

// ─── PUT /api/landing/admin/reorder — save new order ─────────
// Body: { order: ['hero', 'features', 'stats', ...] }
router.put('/admin/reorder', ...ADMIN, async (req, res) => {
  try {
    const { order } = req.body; // array of sectionKeys
    if (!Array.isArray(order)) return res.status(400).json({ message: 'order must be an array of sectionKeys.' });

    const doc = await getDoc();
    const map = {};
    order.forEach((key, idx) => { map[key] = idx; });

    doc.sections.forEach(s => {
      if (map[s.sectionKey] !== undefined) s.order = map[s.sectionKey];
    });
    doc.updatedAt = new Date();
    await doc.save();

    res.json({ success: true, message: 'Order saved.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save order.' });
  }
});

// ─── PUT /api/landing/admin/sections/:key/toggle ──────────────
router.put('/admin/sections/:key/toggle', ...ADMIN, async (req, res) => {
  try {
    const doc = await getDoc();
    const sec = doc.sections.find(s => s.sectionKey === req.params.key);
    if (!sec) return res.status(404).json({ message: 'Section not found.' });

    sec.isVisible = !sec.isVisible;
    doc.updatedAt = new Date();
    await doc.save();

    res.json({ success: true, message: `Section ${sec.isVisible ? 'shown' : 'hidden'}.`, data: { isVisible: sec.isVisible } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle visibility.' });
  }
});

// ─── POST /api/landing/admin/sections/:key/items ─── add item ─
router.post('/admin/sections/:key/items', ...ADMIN, async (req, res) => {
  try {
    const doc = await getDoc();
    const sec = doc.sections.find(s => s.sectionKey === req.params.key);
    if (!sec) return res.status(404).json({ message: 'Section not found.' });

    const newItem = { _itemId: crypto.randomUUID(), fields: req.body.fields || [] };
    sec.items.push(newItem);
    doc.updatedAt = new Date();
    await doc.save();

    res.status(201).json({ success: true, message: 'Item added.', data: newItem });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add item.' });
  }
});

// ─── DELETE /api/landing/admin/sections/:key/items/:itemId ────
router.delete('/admin/sections/:key/items/:itemId', ...ADMIN, async (req, res) => {
  try {
    const doc = await getDoc();
    const sec = doc.sections.find(s => s.sectionKey === req.params.key);
    if (!sec) return res.status(404).json({ message: 'Section not found.' });

    const before = sec.items.length;
    sec.items = sec.items.filter(i => i._itemId !== req.params.itemId);
    if (sec.items.length === before) return res.status(404).json({ message: 'Item not found.' });

    doc.updatedAt = new Date();
    await doc.save();

    res.json({ success: true, message: 'Item deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete item.' });
  }
});

module.exports = router;
