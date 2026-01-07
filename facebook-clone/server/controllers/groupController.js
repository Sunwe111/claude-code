const Group = require('../models/Group');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create group
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name, description, privacy, category, rules } = req.body;

    const group = await Group.create({
      name,
      description,
      privacy: privacy || 'public',
      category: category || 'general',
      rules,
      creator: req.user.id,
      admins: [req.user.id],
      members: [{ user: req.user.id, role: 'admin' }],
      memberCount: 1
    });

    await group.populate('creator', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
exports.getGroups = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;

    const query = { privacy: { $ne: 'secret' } };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const groups = await Group.find(query)
      .populate('creator', 'firstName lastName profilePicture')
      .sort('-memberCount')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Group.countDocuments(query);

    res.json({
      success: true,
      groups,
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

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'firstName lastName profilePicture')
      .populate('members.user', 'firstName lastName profilePicture')
      .populate('admins', 'firstName lastName profilePicture');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user can view secret group
    if (group.privacy === 'secret') {
      const isMember = group.members.some(
        m => m.user._id.toString() === req.user.id
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'This is a secret group'
        });
      }
    }

    res.json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private (Admin only)
exports.updateGroup = async (req, res) => {
  try {
    let group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update the group'
      });
    }

    const allowedFields = ['name', 'description', 'privacy', 'category', 'rules', 'settings'];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    group = await Group.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update group cover photo
// @route   PUT /api/groups/:id/cover
// @access  Private (Admin only)
exports.updateGroupCover = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update the group'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    group.coverPhoto = `/uploads/covers/${req.file.filename}`;
    await group.save();

    res.json({
      success: true,
      coverPhoto: group.coverPhoto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Join group
// @route   POST /api/groups/:id/join
// @access  Private
exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if already member
    const isMember = group.members.some(
      m => m.user.toString() === req.user.id
    );
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this group'
      });
    }

    // Check if already requested
    const hasPending = group.pendingMembers.some(
      p => p.user.toString() === req.user.id
    );
    if (hasPending) {
      return res.status(400).json({
        success: false,
        message: 'Request already pending'
      });
    }

    if (group.privacy === 'private' && group.settings.memberApproval) {
      // Add to pending members
      group.pendingMembers.push({ user: req.user.id });
      await group.save();

      // Notify admins
      const notifications = group.admins.map(adminId => ({
        recipient: adminId,
        sender: req.user.id,
        type: 'group-join-request',
        content: `${req.user.firstName} ${req.user.lastName} wants to join ${group.name}`,
        reference: { group: group._id }
      }));
      await Notification.insertMany(notifications);

      return res.json({
        success: true,
        message: 'Join request sent'
      });
    }

    // Direct join for public groups
    group.members.push({ user: req.user.id, role: 'member' });
    group.memberCount += 1;
    await group.save();

    res.json({
      success: true,
      message: 'Joined group successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Leave group
// @route   DELETE /api/groups/:id/leave
// @access  Private
exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if creator trying to leave
    if (group.creator.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Creator cannot leave the group. Transfer ownership first.'
      });
    }

    group.members = group.members.filter(
      m => m.user.toString() !== req.user.id
    );
    group.admins = group.admins.filter(
      a => a.toString() !== req.user.id
    );
    group.moderators = group.moderators.filter(
      m => m.toString() !== req.user.id
    );
    group.memberCount -= 1;

    await group.save();

    res.json({
      success: true,
      message: 'Left group successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve/Reject member request
// @route   POST /api/groups/:id/members/:userId/approve
// @access  Private (Admin only)
exports.approveMember = async (req, res) => {
  try {
    const { approve } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.admins.includes(req.user.id) && !group.moderators.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Remove from pending
    group.pendingMembers = group.pendingMembers.filter(
      p => p.user.toString() !== req.params.userId
    );

    if (approve) {
      group.members.push({ user: req.params.userId, role: 'member' });
      group.memberCount += 1;

      // Notify user
      await Notification.create({
        recipient: req.params.userId,
        sender: req.user.id,
        type: 'group-invite',
        content: `Your request to join ${group.name} was approved`,
        reference: { group: group._id }
      });
    }

    await group.save();

    res.json({
      success: true,
      message: approve ? 'Member approved' : 'Request rejected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Invite user to group
// @route   POST /api/groups/:id/invite/:userId
// @access  Private
exports.inviteUser = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.settings.allowInvites) {
      const isMod = group.admins.includes(req.user.id) || group.moderators.includes(req.user.id);
      if (!isMod) {
        return res.status(403).json({
          success: false,
          message: 'Only admins can invite users'
        });
      }
    }

    // Check if already member or invited
    const isMember = group.members.some(m => m.user.toString() === req.params.userId);
    const isInvited = group.invitedUsers.some(i => i.user.toString() === req.params.userId);

    if (isMember || isInvited) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member or has been invited'
      });
    }

    group.invitedUsers.push({
      user: req.params.userId,
      invitedBy: req.user.id
    });
    await group.save();

    // Notify user
    await Notification.create({
      recipient: req.params.userId,
      sender: req.user.id,
      type: 'group-invite',
      content: `${req.user.firstName} ${req.user.lastName} invited you to join ${group.name}`,
      reference: { group: group._id }
    });

    res.json({
      success: true,
      message: 'Invitation sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get group posts
// @route   GET /api/groups/:id/posts
// @access  Private
exports.getGroupPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check membership for private groups
    if (group.privacy !== 'public') {
      const isMember = group.members.some(m => m.user.toString() === req.user.id);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Must be a member to view posts'
        });
      }
    }

    const posts = await Post.find({ group: req.params.id })
      .populate('author', 'firstName lastName profilePicture')
      .populate({
        path: 'comments',
        options: { limit: 3, sort: { createdAt: -1 } },
        populate: { path: 'author', select: 'firstName lastName profilePicture' }
      })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({ group: req.params.id });

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

// @desc    Create post in group
// @route   POST /api/groups/:id/posts
// @access  Private (Members only)
exports.createGroupPost = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const isMember = group.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Must be a member to post'
      });
    }

    const { content, visibility } = req.body;

    const postData = {
      author: req.user.id,
      content,
      group: group._id,
      visibility: 'group'
    };

    if (req.files && req.files.length > 0) {
      postData.images = req.files.map(file => ({
        url: `/uploads/posts/${file.filename}`
      }));
    }

    const post = await Post.create(postData);
    await post.populate('author', 'firstName lastName profilePicture');

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

// @desc    Get user's groups
// @route   GET /api/groups/my-groups
// @access  Private
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user.id
    })
      .populate('creator', 'firstName lastName profilePicture')
      .sort('-updatedAt');

    res.json({
      success: true,
      groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private (Admin only)
exports.removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove members'
      });
    }

    // Cannot remove creator
    if (group.creator.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group creator'
      });
    }

    group.members = group.members.filter(
      m => m.user.toString() !== req.params.userId
    );
    group.admins = group.admins.filter(
      a => a.toString() !== req.params.userId
    );
    group.moderators = group.moderators.filter(
      m => m.toString() !== req.params.userId
    );
    group.memberCount -= 1;

    await group.save();

    res.json({
      success: true,
      message: 'Member removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private (Creator only)
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (group.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can delete the group'
      });
    }

    // Delete all group posts
    await Post.deleteMany({ group: group._id });

    await group.deleteOne();

    res.json({
      success: true,
      message: 'Group deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
