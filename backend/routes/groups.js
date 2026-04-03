const express = require('express');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/groups ──────────────────────────────────
// Create a new group
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, type, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const group = await Group.create({
      name,
      type,
      description,
      adminId: req.user.id
    });

    // Spawn the bonded Group Chat document
    await Chat.create({
      isGroupChat: true,
      chatName: name,
      groupRef: group._id,
      participants: [] // empty because membership is computed dynamically via GroupMember
    });

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    console.error('[POST /groups]', err);
    res.status(500).json({ message: 'Failed to create group' });
  }
});

// ─── GET /api/groups ───────────────────────────────────
// Get all groups
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    
    // Add member counts
    const groupIds = groups.map(g => g._id);
    const memberCounts = await GroupMember.aggregate([
      { $match: { groupId: { $in: groupIds } } },
      { $group: { _id: '$groupId', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    memberCounts.forEach(mc => { countMap[mc._id.toString()] = mc.count; });

    const data = groups.map(g => ({
      ...g.toObject(),
      memberCount: countMap[g._id.toString()] || 0
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('[GET /groups]', err);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

// ─── DELETE /api/groups/:groupId ───────────────────────
// Delete a group and its members
router.delete('/:groupId', protect, authorize('admin'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    await GroupMember.deleteMany({ groupId: group._id });
    await Group.findByIdAndDelete(group._id);

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (err) {
    console.error('[DELETE /groups/:groupId]', err);
    res.status(500).json({ message: 'Failed to delete group' });
  }
});

// ─── GET /api/groups/:groupId/members ──────────────────
// Get members of a specific group
router.get('/:groupId/members', protect, authorize('admin'), async (req, res) => {
  try {
    const members = await GroupMember.find({ groupId: req.params.groupId })
      .populate('userId', 'name email role department batch profilePic')
      .sort({ joinedAt: -1 });

    res.json({ success: true, data: members });
  } catch (err) {
    console.error('[GET /groups/members]', err);
    res.status(500).json({ message: 'Failed to fetch group members' });
  }
});

// ─── POST /api/groups/:groupId/members ─────────────────
// Manually add members by user IDs
router.post('/:groupId/members', protect, authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;
    const { groupId } = req.params;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    let addedCount = 0;
    for (const userId of userIds) {
      const exists = await GroupMember.findOne({ groupId, userId });
      if (!exists) {
        await GroupMember.create({ groupId, userId });
        addedCount++;
      }
    }

    res.json({ success: true, message: `Added ${addedCount} members to the group` });
  } catch (err) {
    console.error('[POST /groups/members]', err);
    res.status(500).json({ message: 'Failed to add members' });
  }
});

// ─── POST /api/groups/:groupId/bulk-add ────────────────
// Bulk add members by department or batch
router.post('/:groupId/bulk-add', protect, authorize('admin'), async (req, res) => {
  try {
    const { department, batch } = req.body;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!department && !batch) {
      return res.status(400).json({ message: 'Please provide a department or batch to filter' });
    }

    const query = { status: 'Active' };
    if (department) query.department = department;
    if (batch) query.batch = batch;

    const users = await User.find(query).select('_id');
    const userIds = users.map(u => u._id);

    if (userIds.length === 0) {
      return res.status(404).json({ message: 'No active users found matching criteria' });
    }

    let addedCount = 0;
    for (const userId of userIds) {
      const exists = await GroupMember.findOne({ groupId, userId });
      if (!exists) {
        await GroupMember.create({ groupId, userId });
        addedCount++;
      }
    }

    res.json({ success: true, message: `Added ${addedCount} members to the group out of ${userIds.length} matching users` });
  } catch (err) {
    console.error('[POST /groups/bulk-add]', err);
    res.status(500).json({ message: 'Failed to bulk add members' });
  }
});

// ─── DELETE /api/groups/:groupId/members/:userId ───────
// Remove a member from a group
router.delete('/:groupId/members/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const member = await GroupMember.findOneAndDelete({ groupId, userId });
    if (!member) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }

    res.json({ success: true, message: 'Member removed from group' });
  } catch (err) {
    console.error('[DELETE /groups/member]', err);
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

// ─── GET /api/groups/departments-batches ───────────────
// Get list of distinct departments and batches for the filter dropdowns
router.get('/utils/departments-batches', protect, authorize('admin'), async (req, res) => {
  try {
    const [departments, batches] = await Promise.all([
      User.distinct('department', { department: { $exists: true, $ne: '' } }),
      User.distinct('batch', { batch: { $exists: true, $ne: '' } }),
    ]);

    res.json({
      success: true,
      data: {
        departments: departments.sort(),
        batches: batches.sort(),
      }
    });
  } catch (err) {
    console.error('[GET /departments-batches]', err);
    res.status(500).json({ message: 'Failed to fetch departments and batches lists' });
  }
});

module.exports = router;
