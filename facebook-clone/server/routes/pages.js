const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPage,
  getPages,
  getPage,
  updatePage,
  updatePageProfilePicture,
  likePage,
  followPage,
  getPagePosts,
  createPagePost,
  addReview,
  getMyPages,
  deletePage
} = require('../controllers/pageController');

router.post('/', protect, createPage);
router.get('/', optionalAuth, getPages);
router.get('/my-pages', protect, getMyPages);
router.get('/:id', optionalAuth, getPage);
router.put('/:id', protect, updatePage);
router.put('/:id/profile-picture', protect, upload.single('profilePicture'), updatePageProfilePicture);
router.post('/:id/like', protect, likePage);
router.post('/:id/follow', protect, followPage);
router.get('/:id/posts', optionalAuth, getPagePosts);
router.post('/:id/posts', protect, upload.array('images', 10), createPagePost);
router.post('/:id/reviews', protect, addReview);
router.delete('/:id', protect, deletePage);

module.exports = router;
