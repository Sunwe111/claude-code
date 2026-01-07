const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxLength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: 6,
    select: false
  },
  profilePicture: {
    type: String,
    default: '/uploads/default-avatar.png'
  },
  coverPhoto: {
    type: String,
    default: '/uploads/default-cover.jpg'
  },
  bio: {
    type: String,
    maxLength: 500,
    default: ''
  },
  birthday: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  location: {
    city: String,
    country: String
  },
  workplace: {
    company: String,
    position: String
  },
  education: [{
    school: String,
    degree: String,
    year: Number
  }],
  relationship: {
    status: {
      type: String,
      enum: ['single', 'in-a-relationship', 'engaged', 'married', 'complicated', 'separated', 'divorced', 'widowed', '']
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  sentFriendRequests: [{
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'only-me'],
      default: 'public'
    },
    friendListVisibility: {
      type: String,
      enum: ['public', 'friends', 'only-me'],
      default: 'friends'
    },
    postDefaultVisibility: {
      type: String,
      enum: ['public', 'friends', 'only-me'],
      default: 'friends'
    }
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
