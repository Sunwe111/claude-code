const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get or create conversation
// @route   POST /api/messages/conversation
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { participantId, isGroup, groupName, participants } = req.body;

    if (isGroup) {
      // Create group conversation
      const conversation = await Conversation.create({
        participants: [req.user.id, ...participants],
        type: 'group',
        name: groupName,
        admins: [req.user.id]
      });

      await conversation.populate('participants', 'firstName lastName profilePicture');

      return res.status(201).json({
        success: true,
        conversation
      });
    }

    // Private conversation
    let conversation = await Conversation.findOne({
      type: 'private',
      participants: { $all: [req.user.id, participantId] }
    }).populate('participants', 'firstName lastName profilePicture isOnline lastSeen')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, participantId],
        type: 'private'
      });

      await conversation.populate('participants', 'firstName lastName profilePicture isOnline lastSeen');
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      archivedBy: { $ne: req.user.id }
    })
      .populate('participants', 'firstName lastName profilePicture isOnline lastSeen')
      .populate('lastMessage')
      .sort('-updatedAt');

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get messages in conversation
// @route   GET /api/messages/conversation/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this conversation'
      });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId,
      deletedFor: { $ne: req.user.id }
    })
      .populate('sender', 'firstName lastName profilePicture')
      .populate('replyTo')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      conversation: req.params.conversationId
    });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', replyTo } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const messageData = {
      conversation: conversationId,
      sender: req.user.id,
      content,
      type,
      replyTo
    };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      messageData.attachments = req.files.map(file => ({
        url: `/uploads/messages/${file.filename}`,
        type: file.mimetype,
        name: file.originalname,
        size: file.size
      }));
      messageData.type = 'file';
    }

    const message = await Message.create(messageData);

    // Update conversation
    conversation.lastMessage = message._id;

    // Update unread count for other participants
    conversation.unreadCount = conversation.unreadCount.map(item => {
      if (item.user.toString() !== req.user.id) {
        item.count += 1;
      }
      return item;
    });

    // Add unread count for new participants
    conversation.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        const existing = conversation.unreadCount.find(
          item => item.user.toString() === participantId.toString()
        );
        if (!existing) {
          conversation.unreadCount.push({ user: participantId, count: 1 });
        }
      }
    });

    await conversation.save();

    await message.populate('sender', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/conversation/:conversationId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Mark all messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        'readBy.user': { $ne: req.user.id }
      },
      {
        $push: { readBy: { user: req.user.id, readAt: new Date() } }
      }
    );

    // Reset unread count
    conversation.unreadCount = conversation.unreadCount.map(item => {
      if (item.user.toString() === req.user.id) {
        item.count = 0;
      }
      return item;
    });

    await conversation.save();

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { deleteForEveryone } = req.query;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (deleteForEveryone === 'true' && message.sender.toString() === req.user.id) {
      message.isDeleted = true;
      message.content = 'This message was deleted';
      await message.save();
    } else {
      message.deletedFor.push(req.user.id);
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    React to message
// @route   POST /api/messages/:id/react
// @access  Private
exports.reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const existingIndex = message.reactions.findIndex(
      r => r.user.toString() === req.user.id
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: req.user.id, emoji });
    }

    await message.save();

    res.json({
      success: true,
      reactions: message.reactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update conversation settings
// @route   PUT /api/messages/conversation/:conversationId/settings
// @access  Private
exports.updateConversationSettings = async (req, res) => {
  try {
    const { theme, emoji, nickname } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (theme) conversation.theme = theme;
    if (emoji) conversation.emoji = emoji;
    if (nickname) {
      const nicknameIndex = conversation.nicknames.findIndex(
        n => n.user.toString() === nickname.userId
      );
      if (nicknameIndex > -1) {
        conversation.nicknames[nicknameIndex].nickname = nickname.name;
      } else {
        conversation.nicknames.push({ user: nickname.userId, nickname: nickname.name });
      }
    }

    await conversation.save();

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search
// @access  Private
exports.searchMessages = async (req, res) => {
  try {
    const { q, conversationId } = req.query;

    const query = {
      content: { $regex: q, $options: 'i' },
      deletedFor: { $ne: req.user.id }
    };

    if (conversationId) {
      query.conversation = conversationId;
    } else {
      // Get user's conversations
      const conversations = await Conversation.find({
        participants: req.user.id
      }).select('_id');

      query.conversation = { $in: conversations.map(c => c._id) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName profilePicture')
      .populate('conversation', 'participants')
      .sort('-createdAt')
      .limit(50);

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
