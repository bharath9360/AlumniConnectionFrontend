const express = require('express');
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Connection = require('../models/Connection');
const GroupMember = require('../models/GroupMember');
const { checkMessagingPermission } = require('../utils/messagingPermissions');
const { createNotification } = require('../utils/notifyHelper');
const { requireFields, maxLength, validateObjectId, paginationGuard } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/chat/users/search — Search CONNECTED/GROUP users only
router.get('/users/search', protect, async (req, res) => {
  try {
    const myId = req.user._id;

    // 1. Get Connections
    const connections = await Connection.find({
      $or: [{ user1: myId }, { user2: myId }]
    });
    
    let acceptedIds = connections.map(c => 
      c.user1.toString() === myId.toString() ? c.user2.toString() : c.user1.toString()
    );

    // 2. Get Same-Group Members
    const myGroups = await GroupMember.find({ userId: myId }).select('groupId');
    const myGroupIds = myGroups.map(g => g.groupId.toString());

    if (myGroupIds.length > 0) {
      const peers = await GroupMember.find({ groupId: { $in: myGroupIds } }).select('userId');
      peers.forEach(p => {
        if (p.userId.toString() !== myId.toString()) {
          acceptedIds.push(p.userId.toString());
        }
      });
    }

    // Admins can search anyone, but wait: the search from the frontend might be huge if we return everyone.
    // If admin is active, we return anyone matching query instead
    let query = {};
    if (req.query.q) {
      query.name = { $regex: req.query.q, $options: 'i' };
    }

    if (req.user.role !== 'admin') {
      // De-duplicate ids
      acceptedIds = [...new Set(acceptedIds)];
      if (acceptedIds.length === 0) return res.json([]);
      query._id = { $in: acceptedIds };
    }

    const users = await User.find(query)
      .select('name role department presentStatus profilePic email designation company')
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error searching users.' });
  }
});

// ─── GET /api/chat — Get all chats for current user (1:1 + Groups)
router.get('/', protect, async (req, res) => {
  try {
    const myId = req.user._id;

    // Get 1:1 Chats where user is in participants
    const directChats = await Chat.find({
      isGroupChat: false,
      participants: { $in: [myId] }
    })
      .populate('participants', 'name role profilePic department')
      .sort({ updatedAt: -1 });

    // Get Group Chats based on user's GroupMemberships
    const myGroups = await GroupMember.find({ userId: myId }).select('groupId');
    const groupIds = myGroups.map(g => g.groupId);

    let groupChats = [];
    if (groupIds.length > 0) {
      groupChats = await Chat.find({
        isGroupChat: true,
        groupRef: { $in: groupIds }
      }).sort({ updatedAt: -1 });
    }

    // Merge and sort
    const allChats = [...directChats, ...groupChats].sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt) : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt) : 0;
      return dateB - dateA;
    });

    res.json(allChats);
  } catch (err) {
    console.error('Fetch chats error:', err);
    res.status(500).json({ message: 'Error fetching chats.' });
  }
});

// ─── POST /api/chat — Create or fetch a 1-on-1 chat
router.post('/', protect, requireFields('userId'), async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'UserId param not sent with request' });
  }

  try {
    const targetUser = await User.findById(userId).select('role');
    if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

    // Enforce messaging rules
    const hasPermission = await checkMessagingPermission(
      req.user._id, userId,
      req.user.role, targetUser.role
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: 'You must be connected or share a group to message this user.',
        code: 'NOT_CONNECTED' // Frontend will use this to show CTA
      });
    }

    // Check if chat already exists
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { participants: { $elemMatch: { $eq: req.user._id } } },
        { participants: { $elemMatch: { $eq: userId } } }
      ]
    }).populate('participants', 'name role profilePic department');

    if (isChat.length > 0) {
      res.json(isChat[0]);
    } else {
      // Create a new chat
      const chatData = {
        isGroupChat: false,
        participants: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        'participants',
        'name role profilePic department'
      );
      res.status(200).json(fullChat);
    }
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Error creating chat' });
  }
});


// ─── GET /api/chat/:chatId/messages — Get paginated messages
router.get('/:chatId/messages', protect, validateObjectId('chatId'), paginationGuard, async (req, res) => {
  try {
    const { chatId } = req.params;
    const myId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify chat access (could be optimized)
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (chat.isGroupChat) {
      const isMember = await GroupMember.exists({ userId: myId, groupId: chat.groupRef });
      if (!isMember && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not a member of this group chat.' });
      }
    } else {
      const isParticipant = chat.participants.some(p => p.toString() === myId.toString());
      if (!isParticipant && req.user.role !== 'admin') {
         return res.status(403).json({ message: 'Not authorized.' });
      }
    }

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'name profilePic')
      .populate('chatId');

    const totalMessages = await Message.countDocuments({ chatId });
    
    // Reverse because we extracted descending (newest first for pagination), but rendering needs chronological (top to bottom)
    res.json({
      success: true,
      data: messages.reverse(),
      hasMore: totalMessages > skip + messages.length,
      page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/chat/:chatId/messages — Send a new message (text, image, or both)
router.post(
  '/:chatId/messages',
  protect,
  validateObjectId('chatId'),
  async (req, res) => {
  const { text, image } = req.body;
  const { chatId } = req.params;
  const myId = req.user._id;

  // At least text or image must be provided
  if (!text && !image) {
    return res.status(400).json({ message: 'Message must contain text or an image.' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (chat.isGroupChat) {
      const isMember = await GroupMember.exists({ userId: myId, groupId: chat.groupRef });
      if (!isMember && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'You are not a member of this group chat.' });
      }
    } else {
      const isParticipant = chat.participants.some(p => p.toString() === myId.toString());
      if (!isParticipant && req.user.role !== 'admin') {
         return res.status(403).json({ message: 'Not authorized.' });
      }
      
      // Skip permission check for mentorship chats (they bypass connection requirement)
      if (!chat.isMentorshipChat) {
        // Strict block check on message send attempt
        const targetUserId = chat.participants.find(p => p.toString() !== myId.toString());
        if (targetUserId) {
           const targetUser = await User.findById(targetUserId).select('role');
           const hasPerm = await checkMessagingPermission(myId, targetUserId, req.user.role, targetUser?.role);
           if (!hasPerm) {
             return res.status(403).json({ message: 'You no longer have messaging permission with this user.', code: 'NOT_CONNECTED' });
           }
        }
      }
    }

    // Determine message type
    let messageType = 'text';
    if (image && text) messageType = 'mixed';
    else if (image)    messageType = 'image';

    let message = await Message.create({
      senderId: req.user._id,
      text: text || '',
      image: image || '',
      messageType,
      chatId
    });

    message = await message.populate('senderId', 'name profilePic');
    message = await message.populate('chatId');

    const displayText = messageType === 'image' ? '📷 Image' : (text || '').substring(0, 60);

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: displayText,
        senderId: req.user._id,
        timestamp: new Date()
      },
      updatedAt: new Date()
    });

    // ─── Notify recipients who are NOT currently viewing this chat ───
    const io = req.app.get('io');
    const isUserActiveInChat = req.app.get('isUserActiveInChat');
    const senderId = req.user._id.toString();
    const senderName = req.user.name || 'Someone';
    const preview = displayText;

    // Determine recipients (participants minus sender, or group members)
    let recipientIds = [];
    if (chat.isGroupChat) {
      const members = await GroupMember.find({ groupId: chat.groupRef }).select('userId');
      recipientIds = members
        .map(m => m.userId.toString())
        .filter(id => id !== senderId);
    } else {
      recipientIds = chat.participants
        .map(p => p.toString())
        .filter(id => id !== senderId);
    }

    for (const recipientId of recipientIds) {
      const activeInChat = isUserActiveInChat ? isUserActiveInChat(recipientId, chatId) : false;
      if (!activeInChat) {
        // Persist to DB so it shows on next login
        await createNotification(io, {
          userId: recipientId,
          type: 'message',
          title: `New message from ${senderName}`,
          description: preview,
          icon: '💬',
          relatedId: chat._id
        });
      }
    }

    res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: error.message });
  }
  }
);

// ─── GET /api/chat/unread-count ─ Returns per-chat unread counts for the current user
router.get('/unread-count', protect, async (req, res) => {
  try {
    const myId = req.user._id;
    const counts = await Message.aggregate([
      { $match: { readBy: { $nin: [myId] }, senderId: { $ne: myId } } },
      { $group: { _id: '$chatId', count: { $sum: 1 } } }
    ]);
    // Shape: { [chatId]: count }
    const map = {};
    counts.forEach(c => { map[c._id.toString()] = c.count; });
    res.json({ success: true, data: map });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/chat/:chatId/read ─ Mark all messages in a chat as read for current user
router.put('/:chatId/read', protect, async (req, res) => {
  try {
    const { chatId } = req.params;
    const myId = req.user._id;
    await Message.updateMany(
      { chatId, readBy: { $nin: [myId] }, senderId: { $ne: myId } },
      { $addToSet: { readBy: myId } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
