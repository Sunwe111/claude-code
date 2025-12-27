const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  saveListing,
  contactSeller,
  markAsSold,
  getMyListings,
  getSavedListings,
  getCategories
} = require('../controllers/marketplaceController');

router.post('/', protect, upload.array('marketplaceImages', 10), createListing);
router.get('/', protect, getListings);
router.get('/categories', getCategories);
router.get('/my-listings', protect, getMyListings);
router.get('/saved', protect, getSavedListings);
router.get('/:id', protect, getListing);
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);
router.post('/:id/save', protect, saveListing);
router.post('/:id/contact', protect, contactSeller);
router.put('/:id/sold', protect, markAsSold);

module.exports = router;
