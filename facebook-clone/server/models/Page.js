const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Page name is required'],
    trim: true,
    maxLength: 100
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    maxLength: 2000
  },
  profilePicture: {
    type: String,
    default: '/uploads/default-page-avatar.png'
  },
  coverPhoto: {
    type: String,
    default: '/uploads/default-page-cover.jpg'
  },
  category: {
    type: String,
    enum: [
      'local-business', 'company', 'brand', 'artist', 'musician',
      'public-figure', 'entertainment', 'sports', 'media', 'cause',
      'community', 'government', 'nonprofit', 'other'
    ],
    required: true
  },
  subcategory: String,
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'moderator', 'analyst', 'advertiser'],
      default: 'admin'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  contact: {
    email: String,
    phone: String,
    website: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  hours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    open: String,
    close: String,
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$', '']
  },
  services: [{
    type: String
  }],
  awards: [{
    title: String,
    year: Number
  }],
  milestones: [{
    title: String,
    description: String,
    date: Date
  }],
  callToAction: {
    type: {
      type: String,
      enum: ['book-now', 'contact-us', 'shop-now', 'sign-up', 'learn-more', 'watch-video', 'send-message', '']
    },
    url: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  pinnedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  followerCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

pageSchema.index({ name: 'text', description: 'text' });
pageSchema.index({ category: 1 });
pageSchema.index({ username: 1 });

module.exports = mongoose.model('Page', pageSchema);
