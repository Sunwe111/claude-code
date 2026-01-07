const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createStory,
  getStoriesFeed,
  getStory,
  viewStory,
  reactToStory,
  replyToStory,
  deleteStory,
  getUserStories,
  getStoryViewers
} = require('../controllers/storyController');

router.post('/', protect, upload.single('storyMedia'), createStory);
router.get('/feed', protect, getStoriesFeed);
router.get('/user/:userId', protect, getUserStories);
router.get('/:id', protect, getStory);
router.post('/:id/view', protect, viewStory);
router.post('/:id/react', protect, reactToStory);
router.post('/:id/reply', protect, replyToStory);
router.get('/:id/viewers', protect, getStoryViewers);
router.delete('/:id', protect, deleteStory);

module.exports = router;
