const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Add comment to post
// @route   POST /api/posts/:postId/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const { content, taggedUsers } = req.body;

    const commentData = {
      post: post._id,
      author: req.user.id,
      content,
      taggedUsers
    };

    // Handle image upload
    if (req.file) {
      commentData.image = `/uploads/posts/${req.file.filename}`;
    }

    const comment = await Comment.create(commentData);
    post.comments.push(comment._id);
    await post.save();

    await comment.populate('author', 'firstName lastName profilePicture');

    // Create notification for post author
    if (post.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.author,
        sender: req.user.id,
        type: 'comment-post',
        content: `${req.user.firstName} ${req.user.lastName} commented on your post`,
        reference: { post: post._id, comment: comment._id }
      });
    }

    // Notify tagged users
    if (taggedUsers && taggedUsers.length > 0) {
      const notifications = taggedUsers.map(userId => ({
        recipient: userId,
        sender: req.user.id,
        type: 'tag-comment',
        content: `${req.user.firstName} ${req.user.lastName} mentioned you in a comment`,
        reference: { post: post._id, comment: comment._id }
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get comments for post
// @route   GET /api/posts/:postId/comments
// @access  Private
exports.getComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({
      post: req.params.postId,
      parentComment: { $exists: false }
    })
      .populate('author', 'firstName lastName profilePicture')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'firstName lastName profilePicture' }
      })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({
      post: req.params.postId,
      parentComment: { $exists: false }
    });

    res.json({
      success: true,
      comments,
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

// @desc    Reply to comment
// @route   POST /api/comments/:commentId/reply
// @access  Private
exports.replyToComment = async (req, res) => {
  try {
    const parentComment = await Comment.findById(req.params.commentId);

    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const { content, taggedUsers } = req.body;

    const reply = await Comment.create({
      post: parentComment.post,
      author: req.user.id,
      content,
      parentComment: parentComment._id,
      taggedUsers
    });

    parentComment.replies.push(reply._id);
    await parentComment.save();

    await reply.populate('author', 'firstName lastName profilePicture');

    // Notify parent comment author
    if (parentComment.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: parentComment.author,
        sender: req.user.id,
        type: 'reply-comment',
        content: `${req.user.firstName} ${req.user.lastName} replied to your comment`,
        reference: { post: parentComment.post, comment: reply._id }
      });
    }

    res.status(201).json({
      success: true,
      reply
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();

    await comment.populate('author', 'firstName lastName profilePicture');

    res.json({
      success: true,
      comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Remove from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });

    // Delete replies
    await Comment.deleteMany({ parentComment: comment._id });

    await comment.deleteOne();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Like comment
// @route   POST /api/comments/:id/like
// @access  Private
exports.likeComment = async (req, res) => {
  try {
    const { type = 'like' } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const existingLikeIndex = comment.likes.findIndex(
      like => like.user.toString() === req.user.id
    );

    if (existingLikeIndex > -1) {
      if (comment.likes[existingLikeIndex].type === type) {
        comment.likes.splice(existingLikeIndex, 1);
      } else {
        comment.likes[existingLikeIndex].type = type;
      }
    } else {
      comment.likes.push({ user: req.user.id, type });
    }

    await comment.save();

    res.json({
      success: true,
      likes: comment.likes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
