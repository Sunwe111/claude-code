const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  rsvpEvent,
  inviteToEvent,
  cancelEvent,
  getMyEvents,
  deleteEvent
} = require('../controllers/eventController');

router.post('/', protect, upload.single('coverPhoto'), createEvent);
router.get('/', protect, getEvents);
router.get('/my-events', protect, getMyEvents);
router.get('/:id', protect, getEvent);
router.put('/:id', protect, updateEvent);
router.post('/:id/rsvp', protect, rsvpEvent);
router.post('/:id/invite', protect, inviteToEvent);
router.put('/:id/cancel', protect, cancelEvent);
router.delete('/:id', protect, deleteEvent);

module.exports = router;
