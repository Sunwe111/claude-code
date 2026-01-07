const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  replyToComment,
  updateComment,
  deleteComment,
  likeComment
} = require('../controllers/commentController');

router.post('/:commentId/reply', protect, replyToComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);

module.exports = router;
