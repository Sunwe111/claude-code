const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { content, visibility, feeling, location, taggedUsers } = req.body;

    const postData = {
      author: req.user.id,
      content,
      visibility: visibility || req.user.privacy?.postDefaultVisibility || 'friends',
      feeling,
      location,
      taggedUsers
    };

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      postData.images = req.files.map(file => ({
        url: `/uploads/posts/${file.filename}`
      }));
    }

    const post = await Post.create(postData);
    await post.populate('author', 'firstName lastName profilePicture');

    // Create notifications for tagged users
    if (taggedUsers && taggedUsers.length > 0) {
      const notifications = taggedUsers.map(userId => ({
        recipient: userId,
        sender: req.user.id,
        type: 'tag-post',
        content: `${req.user.fullName} tagged you in a post`,
        reference: { post: post._id }
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get news feed
// @route   GET /api/posts/feed
// @access  Private
exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = await User.findById(req.user.id);

    // Get posts from friends and self
    const friendIds = [...user.friends, req.user.id];

    const posts = await Post.find({
      $or: [
        { author: { $in: friendIds } },
        { visibility: 'public' }
      ],
      group: { $exists: false },
      page: { $exists: false }
    })
      .populate('author', 'firstName lastName profilePicture')
      .populate('taggedUsers', 'firstName lastName')
      .populate({
        path: 'comments',
        options: { limit: 3, sort: { createdAt: -1 } },
        populate: { path: 'author', select: 'firstName lastName profilePicture' }
      })
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'firstName lastName profilePicture' }
      })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({
      $or: [
        { author: { $in: friendIds } },
        { visibility: 'public' }
      ]
    });

    res.json({
      success: true,
      posts,
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

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'firstName lastName profilePicture')
      .populate('taggedUsers', 'firstName lastName')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'firstName lastName profilePicture' }
      })
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'firstName lastName profilePicture' }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Private
exports.getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'firstName lastName profilePicture')
      .populate('taggedUsers', 'firstName lastName')
      .populate({
        path: 'comments',
        options: { limit: 3, sort: { createdAt: -1 } },
        populate: { path: 'author', select: 'firstName lastName profilePicture' }
      })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ author: req.params.userId });

    res.json({
      success: true,
      posts,
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

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const { content, visibility, feeling, location } = req.body;

    // Save edit history
    post.editHistory.push({
      content: post.content,
      editedAt: new Date()
    });
    post.isEdited = true;

    post.content = content || post.content;
    post.visibility = visibility || post.visibility;
    post.feeling = feeling || post.feeling;
    post.location = location || post.location;

    await post.save();
    await post.populate('author', 'firstName lastName profilePicture');

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete all comments
    await Comment.deleteMany({ post: post._id });

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like/React to post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const { type = 'like' } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked
    const existingLikeIndex = post.likes.findIndex(
      like => like.user.toString() === req.user.id
    );

    if (existingLikeIndex > -1) {
      // Update reaction type or remove
      if (post.likes[existingLikeIndex].type === type) {
        post.likes.splice(existingLikeIndex, 1);
      } else {
        post.likes[existingLikeIndex].type = type;
      }
    } else {
      post.likes.push({ user: req.user.id, type });

      // Create notification
      if (post.author.toString() !== req.user.id) {
        await Notification.create({
          recipient: post.author,
          sender: req.user.id,
          type: 'like-post',
          content: `${req.user.firstName} ${req.user.lastName} reacted to your post`,
          reference: { post: post._id }
        });
      }
    }

    await post.save();

    res.json({
      success: true,
      likes: post.likes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Share post
// @route   POST /api/posts/:id/share
// @access  Private
exports.sharePost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const { content, visibility } = req.body;

    // Create shared post
    const sharedPost = await Post.create({
      author: req.user.id,
      content,
      visibility: visibility || 'friends',
      originalPost: originalPost._id,
      isShared: true
    });

    // Add to original post's shares
    originalPost.shares.push({ user: req.user.id });
    await originalPost.save();

    // Create notification
    if (originalPost.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: originalPost.author,
        sender: req.user.id,
        type: 'share-post',
        content: `${req.user.firstName} ${req.user.lastName} shared your post`,
        reference: { post: originalPost._id }
      });
    }

    await sharedPost.populate('author', 'firstName lastName profilePicture');
    await sharedPost.populate({
      path: 'originalPost',
      populate: { path: 'author', select: 'firstName lastName profilePicture' }
    });

    res.status(201).json({
      success: true,
      post: sharedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
