const Story = require('../models/Story');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
  try {
    const { type, text, caption, visibility, mentions } = req.body;

    const storyData = {
      author: req.user.id,
      type,
      caption,
      visibility: visibility || 'friends',
      mentions
    };

    if (type === 'text') {
      storyData.text = text;
    } else if (req.file) {
      storyData.media = {
        url: `/uploads/stories/${req.file.filename}`
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Media is required for image/video stories'
      });
    }

    const story = await Story.create(storyData);
    await story.populate('author', 'firstName lastName profilePicture');

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
      const notifications = mentions.map(mention => ({
        recipient: mention.user,
        sender: req.user.id,
        type: 'mention',
        content: `${req.user.firstName} ${req.user.lastName} mentioned you in their story`,
        reference: { story: story._id }
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      story
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get stories feed
// @route   GET /api/stories/feed
// @access  Private
exports.getStoriesFeed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const friendIds = [...user.friends, req.user.id];

    // Get stories from friends that haven't expired
    const stories = await Story.aggregate([
      {
        $match: {
          author: { $in: friendIds.map(id => require('mongoose').Types.ObjectId(id)) },
          expiresAt: { $gt: new Date() },
          hiddenFrom: { $ne: require('mongoose').Types.ObjectId(req.user.id) }
        }
      },
      {
        $group: {
          _id: '$author',
          stories: { $push: '$$ROOT' },
          latestStory: { $max: '$createdAt' }
        }
      },
      { $sort: { latestStory: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      { $unwind: '$authorInfo' },
      {
        $project: {
          author: {
            _id: '$authorInfo._id',
            firstName: '$authorInfo.firstName',
            lastName: '$authorInfo.lastName',
            profilePicture: '$authorInfo.profilePicture'
          },
          stories: 1,
          latestStory: 1
        }
      }
    ]);

    // Check which stories user has viewed
    const storiesWithViewStatus = stories.map(group => ({
      ...group,
      stories: group.stories.map(story => ({
        ...story,
        hasViewed: story.viewers?.some(
          v => v.user.toString() === req.user.id
        ) || false
      })),
      hasUnviewed: group.stories.some(
        story => !story.viewers?.some(
          v => v.user.toString() === req.user.id
        )
      )
    }));

    res.json({
      success: true,
      stories: storiesWithViewStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Private
exports.getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('author', 'firstName lastName profilePicture')
      .populate('viewers.user', 'firstName lastName profilePicture')
      .populate('reactions.user', 'firstName lastName profilePicture');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found or expired'
      });
    }

    res.json({
      success: true,
      story
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    View story
// @route   POST /api/stories/:id/view
// @access  Private
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if already viewed
    const hasViewed = story.viewers.some(
      v => v.user.toString() === req.user.id
    );

    if (!hasViewed) {
      story.viewers.push({ user: req.user.id });
      await story.save();
    }

    res.json({
      success: true,
      message: 'Story viewed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    React to story
// @route   POST /api/stories/:id/react
// @access  Private
exports.reactToStory = async (req, res) => {
  try {
    const { emoji } = req.body;
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    const existingIndex = story.reactions.findIndex(
      r => r.user.toString() === req.user.id
    );

    if (existingIndex > -1) {
      story.reactions[existingIndex].emoji = emoji;
    } else {
      story.reactions.push({ user: req.user.id, emoji });

      // Notify story author
      if (story.author.toString() !== req.user.id) {
        await Notification.create({
          recipient: story.author,
          sender: req.user.id,
          type: 'story-reaction',
          content: `${req.user.firstName} ${req.user.lastName} reacted to your story`,
          reference: { story: story._id }
        });
      }
    }

    await story.save();

    res.json({
      success: true,
      reactions: story.reactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reply to story
// @route   POST /api/stories/:id/reply
// @access  Private
exports.replyToStory = async (req, res) => {
  try {
    const { content } = req.body;
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    story.replies.push({ user: req.user.id, content });
    await story.save();

    res.json({
      success: true,
      message: 'Reply sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    if (story.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await story.deleteOne();

    res.json({
      success: true,
      message: 'Story deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's stories
// @route   GET /api/stories/user/:userId
// @access  Private
exports.getUserStories = async (req, res) => {
  try {
    const stories = await Story.find({
      author: req.params.userId,
      expiresAt: { $gt: new Date() }
    })
      .populate('author', 'firstName lastName profilePicture')
      .sort('-createdAt');

    res.json({
      success: true,
      stories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get story viewers
// @route   GET /api/stories/:id/viewers
// @access  Private
exports.getStoryViewers = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('viewers.user', 'firstName lastName profilePicture');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    if (story.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      viewers: story.viewers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
