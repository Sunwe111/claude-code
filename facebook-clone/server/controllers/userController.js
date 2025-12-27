const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public/Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -friendRequests -sentFriendRequests -blockedUsers')
      .populate('friends', 'firstName lastName profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ author: user._id });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        postsCount,
        friendsCount: user.friends.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'bio', 'birthday', 'gender',
      'location', 'workplace', 'education', 'relationship'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update profile picture
// @route   PUT /api/users/profile-picture
// @access  Private
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: `/uploads/avatars/${req.file.filename}` },
      { new: true }
    );

    res.json({
      success: true,
      profilePicture: user.profilePicture
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update cover photo
// @route   PUT /api/users/cover-photo
// @access  Private
exports.updateCoverPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { coverPhoto: `/uploads/covers/${req.file.filename}` },
      { new: true }
    );

    res.json({
      success: true,
      coverPhoto: user.coverPhoto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }
    })
      .select('firstName lastName profilePicture bio')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }
    });

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's friends
// @route   GET /api/users/:id/friends
// @access  Private
exports.getUserFriends = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('friends', 'firstName lastName profilePicture bio location');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      friends: user.friends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's photos
// @route   GET /api/users/:id/photos
// @access  Private
exports.getUserPhotos = async (req, res) => {
  try {
    const posts = await Post.find({
      author: req.params.id,
      'images.0': { $exists: true }
    })
      .select('images createdAt')
      .sort('-createdAt')
      .limit(50);

    const photos = posts.reduce((acc, post) => {
      post.images.forEach(img => {
        acc.push({
          url: img.url,
          postId: post._id,
          createdAt: post.createdAt
        });
      });
      return acc;
    }, []);

    res.json({
      success: true,
      photos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update privacy settings
// @route   PUT /api/users/privacy
// @access  Private
exports.updatePrivacy = async (req, res) => {
  try {
    const { profileVisibility, friendListVisibility, postDefaultVisibility } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        privacy: {
          profileVisibility,
          friendListVisibility,
          postDefaultVisibility
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      privacy: user.privacy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Block user
// @route   POST /api/users/:id/block
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.id);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = await User.findById(req.user.id);

    // Check if already blocked
    if (user.blockedUsers.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already blocked'
      });
    }

    // Add to blocked list
    user.blockedUsers.push(req.params.id);

    // Remove from friends if they are friends
    user.friends = user.friends.filter(
      friend => friend.toString() !== req.params.id
    );
    userToBlock.friends = userToBlock.friends.filter(
      friend => friend.toString() !== req.user.id
    );

    await user.save();
    await userToBlock.save();

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unblock user
// @route   DELETE /api/users/:id/block
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.blockedUsers = user.blockedUsers.filter(
      id => id.toString() !== req.params.id
    );

    await user.save();

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get friend suggestions
// @route   GET /api/users/suggestions
// @access  Private
exports.getFriendSuggestions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get friends of friends who are not already friends
    const friendIds = user.friends.map(f => f.toString());
    const excludeIds = [
      req.user.id,
      ...friendIds,
      ...user.blockedUsers.map(b => b.toString()),
      ...user.sentFriendRequests.map(r => r.to.toString()),
      ...user.friendRequests.map(r => r.from.toString())
    ];

    // Find users who share mutual friends
    const suggestions = await User.aggregate([
      { $match: { _id: { $nin: excludeIds.map(id => require('mongoose').Types.ObjectId(id)) } } },
      {
        $addFields: {
          mutualFriends: {
            $size: {
              $setIntersection: ['$friends', user.friends]
            }
          }
        }
      },
      { $sort: { mutualFriends: -1 } },
      { $limit: 10 },
      { $project: { firstName: 1, lastName: 1, profilePicture: 1, mutualFriends: 1 } }
    ]);

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
