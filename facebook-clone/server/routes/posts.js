const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPost,
  getFeed,
  getPost,
  getUserPosts,
  updatePost,
  deletePost,
  likePost,
  sharePost
} = require('../controllers/postController');
const {
  addComment,
  getComments
} = require('../controllers/commentController');

router.post('/', protect, upload.array('images', 10), createPost);
router.get('/feed', protect, getFeed);
router.get('/:id', protect, getPost);
router.get('/user/:userId', protect, getUserPosts);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/share', protect, sharePost);

// Comments
router.post('/:postId/comments', protect, upload.single('image'), addComment);
router.get('/:postId/comments', protect, getComments);

module.exports = router;
