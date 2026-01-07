const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  reactToMessage,
  updateConversationSettings,
  searchMessages
} = require('../controllers/messageController');

router.post('/conversation', protect, getOrCreateConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversation/:conversationId', protect, getMessages);
router.post('/', protect, upload.array('attachments', 5), sendMessage);
router.put('/conversation/:conversationId/read', protect, markAsRead);
router.delete('/:id', protect, deleteMessage);
router.post('/:id/react', protect, reactToMessage);
router.put('/conversation/:conversationId/settings', protect, updateConversationSettings);
router.get('/search', protect, searchMessages);

module.exports = router;
