const Page = require('../models/Page');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Create page
// @route   POST /api/pages
// @access  Private
exports.createPage = async (req, res) => {
  try {
    const { name, username, description, category, subcategory, contact } = req.body;

    // Check if username is taken
    if (username) {
      const existingPage = await Page.findOne({ username: username.toLowerCase() });
      if (existingPage) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    const page = await Page.create({
      name,
      username: username?.toLowerCase(),
      description,
      category,
      subcategory,
      contact,
      creator: req.user.id,
      admins: [{ user: req.user.id, role: 'admin' }],
      followers: [req.user.id],
      likes: [req.user.id],
      followerCount: 1,
      likeCount: 1
    });

    await page.populate('creator', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all pages
// @route   GET /api/pages
// @access  Public
exports.getPages = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;

    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const pages = await Page.find(query)
      .select('name username profilePicture category followerCount isVerified')
      .sort('-followerCount')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Page.countDocuments(query);

    res.json({
      success: true,
      pages,
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

// @desc    Get single page
// @route   GET /api/pages/:id
// @access  Public
exports.getPage = async (req, res) => {
  try {
    let page;

    // Check if it's an ID or username
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      page = await Page.findById(req.params.id);
    } else {
      page = await Page.findOne({ username: req.params.id.toLowerCase() });
    }

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    await page.populate('creator', 'firstName lastName profilePicture');
    await page.populate('admins.user', 'firstName lastName profilePicture');

    res.json({
      success: true,
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update page
// @route   PUT /api/pages/:id
// @access  Private (Admin only)
exports.updatePage = async (req, res) => {
  try {
    let page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Check if user is admin
    const isAdmin = page.admins.some(
      a => a.user.toString() === req.user.id && ['admin', 'editor'].includes(a.role)
    );
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const allowedFields = [
      'name', 'description', 'category', 'subcategory',
      'contact', 'hours', 'priceRange', 'services', 'callToAction'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    page = await Page.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update page profile picture
// @route   PUT /api/pages/:id/profile-picture
// @access  Private (Admin only)
exports.updatePageProfilePicture = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    const isAdmin = page.admins.some(
      a => a.user.toString() === req.user.id
    );
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    page.profilePicture = `/uploads/avatars/${req.file.filename}`;
    await page.save();

    res.json({
      success: true,
      profilePicture: page.profilePicture
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like/Unlike page
// @route   POST /api/pages/:id/like
// @access  Private
exports.likePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    const hasLiked = page.likes.includes(req.user.id);

    if (hasLiked) {
      page.likes = page.likes.filter(id => id.toString() !== req.user.id);
      page.likeCount -= 1;
    } else {
      page.likes.push(req.user.id);
      page.likeCount += 1;

      // Also follow if not already
      if (!page.followers.includes(req.user.id)) {
        page.followers.push(req.user.id);
        page.followerCount += 1;
      }
    }

    await page.save();

    res.json({
      success: true,
      liked: !hasLiked,
      likeCount: page.likeCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Follow/Unfollow page
// @route   POST /api/pages/:id/follow
// @access  Private
exports.followPage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    const isFollowing = page.followers.includes(req.user.id);

    if (isFollowing) {
      page.followers = page.followers.filter(id => id.toString() !== req.user.id);
      page.followerCount -= 1;
    } else {
      page.followers.push(req.user.id);
      page.followerCount += 1;
    }

    await page.save();

    res.json({
      success: true,
      following: !isFollowing,
      followerCount: page.followerCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get page posts
// @route   GET /api/pages/:id/posts
// @access  Public
exports.getPagePosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({ page: req.params.id })
      .populate('author', 'firstName lastName profilePicture')
      .populate({
        path: 'comments',
        options: { limit: 3, sort: { createdAt: -1 } },
        populate: { path: 'author', select: 'firstName lastName profilePicture' }
      })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ page: req.params.id });

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

// @desc    Create post on page
// @route   POST /api/pages/:id/posts
// @access  Private (Admin only)
exports.createPagePost = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    const isAdmin = page.admins.some(
      a => a.user.toString() === req.user.id && ['admin', 'editor'].includes(a.role)
    );
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { content } = req.body;

    const postData = {
      author: req.user.id,
      content,
      page: page._id,
      visibility: 'public'
    };

    if (req.files && req.files.length > 0) {
      postData.images = req.files.map(file => ({
        url: `/uploads/posts/${file.filename}`
      }));
    }

    const post = await Post.create(postData);
    await post.populate('author', 'firstName lastName profilePicture');

    // Notify followers
    const notifications = page.followers
      .filter(id => id.toString() !== req.user.id)
      .slice(0, 100) // Limit notifications
      .map(followerId => ({
        recipient: followerId,
        sender: req.user.id,
        type: 'page-post',
        content: `${page.name} posted an update`,
        reference: { page: page._id, post: post._id }
      }));

    if (notifications.length > 0) {
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

// @desc    Add review to page
// @route   POST /api/pages/:id/reviews
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    const { rating, content } = req.body;

    // Check if already reviewed
    const existingReview = page.reviews.find(
      r => r.user.toString() === req.user.id
    );
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this page'
      });
    }

    page.reviews.push({ user: req.user.id, rating, content });

    // Update average rating
    const totalRating = page.reviews.reduce((sum, r) => sum + r.rating, 0);
    page.rating.average = totalRating / page.reviews.length;
    page.rating.count = page.reviews.length;

    await page.save();

    res.status(201).json({
      success: true,
      rating: page.rating
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's pages
// @route   GET /api/pages/my-pages
// @access  Private
exports.getMyPages = async (req, res) => {
  try {
    const pages = await Page.find({
      'admins.user': req.user.id
    }).select('name username profilePicture category followerCount');

    res.json({
      success: true,
      pages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete page
// @route   DELETE /api/pages/:id
// @access  Private (Creator only)
exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    if (page.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can delete the page'
      });
    }

    // Delete all page posts
    await Post.deleteMany({ page: page._id });

    await page.deleteOne();

    res.json({
      success: true,
      message: 'Page deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
