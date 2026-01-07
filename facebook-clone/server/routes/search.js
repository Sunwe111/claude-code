const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  globalSearch,
  getSearchSuggestions,
  getHashtagPosts
} = require('../controllers/searchController');

router.get('/', protect, globalSearch);
router.get('/suggestions', protect, getSearchSuggestions);
router.get('/hashtag/:tag', protect, getHashtagPosts);

module.exports = router;
