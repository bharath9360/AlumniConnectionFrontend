const express = require('express');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/chat/users/search — Search CONNECTED users only
// Only returns users who share an 'Accepted' connection with the requester
router.get('/users/search', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('connections');
    const acceptedIds = (me?.connections || [])
      .filter(c => c.status === 'Accepted')
      .map(c => c.userId);

    if (acceptedIds.length === 0) return res.json([]);

    const keyword = req.query.q
      ? { name: { $regex: req.query.q, $options: 'i' } }
      : {};

    const users = await User.find({
      ...keyword,
      _id: { $in: acceptedIds }  // ← only show connections
    })
      .select('name role department presentStatus profilePic email designation company')
      .limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error searching users.' });
  }
});

// ─── GET /api/chat — Get all chats for current user
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: { $in: [req.user._id] } })
      .populate('participants', 'name role profilePic department')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chats.' });
  }
});

// ─── POST /api/chat — Create or fetch a 1-on-1 chat (connections only)
router.post('/', protect, async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'UserId param not sent with request' });
  }

  try {
    // ── TASK 3 FIX: Verify users are accepted connections ──────────────
    const me = await User.findById(req.user._id).select('connections');
    const isConnected = (me?.connections || []).some(
      c => c.userId.toString() === userId && c.status === 'Accepted'
    );

    if (!isConnected) {
      return res.status(403).json({
        message: 'You must be connected to send a message to this user.',
        code: 'NOT_CONNECTED'
      });
    }

    // Check if chat already exists
    let isChat = await Chat.find({
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
    res.status(500).json({ message: 'Error creating chat' });
  }
});


// ─── GET /api/chat/:chatId/messages — Get all messages in a chat
router.get('/:chatId/messages', protect, async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('senderId', 'name profilePic')
      .populate('chatId');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /api/chat/:chatId/messages — Send a new message (REST fallback)
router.post('/:chatId/messages', protect, async (req, res) => {
  const { text } = req.body;
  const { chatId } = req.params;

  if (!text || !chatId) {
    return res.status(400).json({ message: 'Invalid data passed into request' });
  }

  try {
    let message = await Message.create({
      senderId: req.user._id,
      text,
      chatId
    });

    message = await message.populate('senderId', 'name profilePic');
    message = await message.populate('chatId');

    await Chat.findByIdAndUpdate(req.params.chatId, {
      lastMessage: {
        text: text,
        senderId: req.user._id,
        timestamp: new Date()
      }
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
