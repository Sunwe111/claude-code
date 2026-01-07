const User = require('../models/User');
const Post = require('../models/Post');
const Group = require('../models/Group');
const Page = require('../models/Page');
const Event = require('../models/Event');
const Marketplace = require('../models/Marketplace');

// @desc    Global search
// @route   GET /api/search
// @access  Private
exports.globalSearch = async (req, res) => {
  try {
    const { q, type, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = {};

    // Search based on type or all
    if (!type || type === 'all' || type === 'people') {
      const users = await User.find({
        $or: [
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } }
        ],
        _id: { $ne: req.user.id }
      })
        .select('firstName lastName profilePicture bio')
        .limit(type === 'people' ? limit : 5);

      results.people = users;
    }

    if (!type || type === 'all' || type === 'posts') {
      const user = await User.findById(req.user.id);
      const friendIds = [...user.friends, req.user.id];

      const posts = await Post.find({
        content: { $regex: q, $options: 'i' },
        $or: [
          { author: { $in: friendIds } },
          { visibility: 'public' }
        ]
      })
        .populate('author', 'firstName lastName profilePicture')
        .sort('-createdAt')
        .limit(type === 'posts' ? limit : 5);

      results.posts = posts;
    }

    if (!type || type === 'all' || type === 'groups') {
      const groups = await Group.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ],
        privacy: { $ne: 'secret' }
      })
        .select('name coverPhoto memberCount privacy')
        .limit(type === 'groups' ? limit : 5);

      results.groups = groups;
    }

    if (!type || type === 'all' || type === 'pages') {
      const pages = await Page.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      })
        .select('name profilePicture category followerCount isVerified')
        .limit(type === 'pages' ? limit : 5);

      results.pages = pages;
    }

    if (!type || type === 'all' || type === 'events') {
      const events = await Event.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ],
        privacy: 'public',
        startDate: { $gte: new Date() },
        isCancelled: false
      })
        .select('name coverPhoto startDate location goingCount')
        .limit(type === 'events' ? limit : 5);

      results.events = events;
    }

    if (!type || type === 'all' || type === 'marketplace') {
      const listings = await Marketplace.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ],
        availability: 'available',
        isActive: true
      })
        .select('title images price location')
        .limit(type === 'marketplace' ? limit : 5);

      results.marketplace = listings;
    }

    res.json({
      success: true,
      query: q,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Private
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = [];

    // Get user suggestions
    const users = await User.find({
      $or: [
        { firstName: { $regex: `^${q}`, $options: 'i' } },
        { lastName: { $regex: `^${q}`, $options: 'i' } }
      ]
    })
      .select('firstName lastName profilePicture')
      .limit(3);

    users.forEach(user => {
      suggestions.push({
        type: 'user',
        id: user._id,
        text: `${user.firstName} ${user.lastName}`,
        image: user.profilePicture
      });
    });

    // Get page suggestions
    const pages = await Page.find({
      name: { $regex: `^${q}`, $options: 'i' }
    })
      .select('name profilePicture category')
      .limit(2);

    pages.forEach(page => {
      suggestions.push({
        type: 'page',
        id: page._id,
        text: page.name,
        image: page.profilePicture,
        subtitle: page.category
      });
    });

    // Get group suggestions
    const groups = await Group.find({
      name: { $regex: `^${q}`, $options: 'i' },
      privacy: { $ne: 'secret' }
    })
      .select('name coverPhoto')
      .limit(2);

    groups.forEach(group => {
      suggestions.push({
        type: 'group',
        id: group._id,
        text: group.name,
        image: group.coverPhoto
      });
    });

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

// @desc    Get hashtag posts
// @route   GET /api/search/hashtag/:tag
// @access  Private
exports.getHashtagPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const tag = req.params.tag;

    const posts = await Post.find({
      content: { $regex: `#${tag}\\b`, $options: 'i' },
      visibility: 'public'
    })
      .populate('author', 'firstName lastName profilePicture')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({
      content: { $regex: `#${tag}\\b`, $options: 'i' },
      visibility: 'public'
    });

    res.json({
      success: true,
      hashtag: tag,
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
