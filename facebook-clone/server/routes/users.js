const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getUserProfile,
  updateProfile,
  updateProfilePicture,
  updateCoverPhoto,
  searchUsers,
  getUserFriends,
  getUserPhotos,
  updatePrivacy,
  blockUser,
  unblockUser,
  getFriendSuggestions
} = require('../controllers/userController');

router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getFriendSuggestions);
router.get('/:id', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile-picture', protect, upload.single('profilePicture'), updateProfilePicture);
router.put('/cover-photo', protect, upload.single('coverPhoto'), updateCoverPhoto);
router.get('/:id/friends', protect, getUserFriends);
router.get('/:id/photos', protect, getUserPhotos);
router.put('/privacy', protect, updatePrivacy);
router.post('/:id/block', protect, blockUser);
router.delete('/:id/block', protect, unblockUser);

module.exports = router;
