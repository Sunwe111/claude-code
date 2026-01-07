const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    maxLength: 2000
  },
  coverPhoto: {
    type: String,
    default: '/uploads/default-group-cover.jpg'
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'public'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pendingMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  invitedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bannedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bannedAt: {
      type: Date,
      default: Date.now
    }
  }],
  rules: [{
    title: String,
    description: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: [
      'general', 'gaming', 'sports', 'music', 'art', 'technology',
      'science', 'education', 'business', 'health', 'food', 'travel',
      'lifestyle', 'entertainment', 'news', 'other'
    ],
    default: 'general'
  },
  settings: {
    postApproval: {
      type: Boolean,
      default: false
    },
    memberApproval: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    }
  },
  pinnedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  memberCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ category: 1 });
groupSchema.index({ privacy: 1 });

module.exports = mongoose.model('Group', groupSchema);
