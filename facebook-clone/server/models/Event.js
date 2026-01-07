const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    maxLength: 5000
  },
  coverPhoto: {
    type: String,
    default: '/uploads/default-event-cover.jpg'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hostPage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page'
  },
  hostGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'none'
  },
  location: {
    type: {
      type: String,
      enum: ['physical', 'online', 'hybrid'],
      default: 'physical'
    },
    venue: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    onlineLink: String,
    onlinePlatform: String
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'friends'],
    default: 'public'
  },
  category: {
    type: String,
    enum: [
      'social', 'party', 'concert', 'festival', 'sports', 'fitness',
      'food', 'arts', 'film', 'learning', 'conference', 'networking',
      'charity', 'community', 'travel', 'other'
    ],
    default: 'social'
  },
  ticketInfo: {
    isFree: {
      type: Boolean,
      default: true
    },
    price: Number,
    currency: String,
    ticketUrl: String,
    maxAttendees: Number
  },
  going: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  interested: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  invited: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'going', 'interested', 'declined'],
      default: 'pending'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  declined: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  covidInfo: {
    requiresMask: Boolean,
    requiresVaccination: Boolean,
    socialDistancing: Boolean,
    additionalInfo: String
  },
  goingCount: {
    type: Number,
    default: 0
  },
  interestedCount: {
    type: Number,
    default: 0
  },
  isCancelled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

eventSchema.index({ name: 'text', description: 'text' });
eventSchema.index({ startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ 'location.address.city': 1 });

module.exports = mongoose.model('Event', eventSchema);
