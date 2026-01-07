const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'text'],
    required: true
  },
  media: {
    url: String,
    thumbnail: String
  },
  text: {
    content: String,
    backgroundColor: String,
    fontStyle: String
  },
  caption: {
    type: String,
    maxLength: 500
  },
  music: {
    name: String,
    artist: String,
    url: String
  },
  stickers: [{
    type: String,
    x: Number,
    y: Number,
    scale: Number,
    rotation: Number
  }],
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    x: Number,
    y: Number
  }],
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'friends', 'close-friends', 'custom'],
    default: 'friends'
  },
  hiddenFrom: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  isHighlight: {
    type: Boolean,
    default: false
  },
  highlightCategory: {
    type: String
  }
}, {
  timestamps: true
});

// Auto-delete expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema);
