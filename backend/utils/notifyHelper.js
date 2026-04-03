/**
 * notifyHelper.js
 * ─────────────────────────────────────────────────────
 * Single helper to persist a Notification to MongoDB
 * AND push it to the user's socket room in one call.
 *
 * Usage in any route:
 *   const { createNotification } = require('../utils/notifyHelper');
 *   await createNotification(req.app.get('io'), {
 *     userId, type, title, description, icon, relatedId
 *   });
 */

const Notification = require('../models/Notification');

/**
 * @param {import('socket.io').Server|null} io
 * @param {{ userId, type, title, description?, icon?, relatedId? }} payload
 * @returns {Promise<import('../models/Notification')>} saved notification
 */
const createNotification = async (io, { userId, type, title, description = '', icon = '🔔', relatedId = null }) => {
  try {
    const notif = await Notification.create({ userId, type, title, description, icon, relatedId });

    if (io && userId) {
      io.to(userId.toString()).emit('notification_received', notif.toObject());
    }

    return notif;
  } catch (err) {
    // Non-fatal — log and continue
    console.error('[notifyHelper] Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Bulk-notify multiple users (e.g. all students/alumni for a new job).
 * Uses insertMany for performance then emits individually via socket.
 *
 * @param {import('socket.io').Server|null} io
 * @param {Array} userIds - array of ObjectId or string
 * @param {{ type, title, description?, icon?, relatedId? }} payload
 */
const notifyMany = async (io, userIds, { type, title, description = '', icon = '🔔', relatedId = null }) => {
  if (!userIds?.length) return;
  try {
    const docs = userIds.map(userId => ({ userId, type, title, description, icon, relatedId }));
    const created = await Notification.insertMany(docs);

    if (io) {
      created.forEach(notif => {
        io.to(notif.userId.toString()).emit('notification_received', notif.toObject());
      });
    }
  } catch (err) {
    console.error('[notifyHelper] notifyMany failed:', err.message);
  }
};

module.exports = { createNotification, notifyMany };
