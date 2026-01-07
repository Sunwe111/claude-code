const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  unfriend,
  getFriendRequests,
  getSentRequests,
  getFriends,
  getMutualFriends
} = require('../controllers/friendController');

router.get('/', protect, getFriends);
router.get('/requests', protect, getFriendRequests);
router.get('/sent', protect, getSentRequests);
router.get('/mutual/:userId', protect, getMutualFriends);
router.post('/request/:userId', protect, sendFriendRequest);
router.post('/accept/:userId', protect, acceptFriendRequest);
router.delete('/reject/:userId', protect, rejectFriendRequest);
router.delete('/cancel/:userId', protect, cancelFriendRequest);
router.delete('/:userId', protect, unfriend);

module.exports = router;
