const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'friend-request',
      'friend-accepted',
      'like-post',
      'comment-post',
      'reply-comment',
      'share-post',
      'tag-post',
      'tag-comment',
      'group-invite',
      'group-join-request',
      'group-post',
      'page-like',
      'page-post',
      'event-invite',
      'event-reminder',
      'birthday',
      'message',
      'story-reaction',
      'mention'
    ],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  link: {
    type: String
  },
  reference: {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    page: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page'
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
