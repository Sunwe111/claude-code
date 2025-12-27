const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Send friend request
// @route   POST /api/friends/request/:userId
// @access  Private
exports.sendFriendRequest = async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    const recipient = await User.findById(req.params.userId);
    const sender = await User.findById(req.user.id);

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already friends
    if (sender.friends.includes(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user'
      });
    }

    // Check if request already sent
    const existingRequest = sender.sentFriendRequests.find(
      r => r.to.toString() === req.params.userId
    );
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }

    // Check if they sent us a request
    const theirRequest = sender.friendRequests.find(
      r => r.from.toString() === req.params.userId
    );
    if (theirRequest) {
      return res.status(400).json({
        success: false,
        message: 'This user already sent you a friend request'
      });
    }

    // Check if blocked
    if (recipient.blockedUsers.includes(req.user.id) || sender.blockedUsers.includes(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request'
      });
    }

    // Add to sent requests
    sender.sentFriendRequests.push({ to: req.params.userId });
    await sender.save();

    // Add to recipient's requests
    recipient.friendRequests.push({ from: req.user.id });
    await recipient.save();

    // Create notification
    await Notification.create({
      recipient: req.params.userId,
      sender: req.user.id,
      type: 'friend-request',
      content: `${sender.firstName} ${sender.lastName} sent you a friend request`
    });

    res.json({
      success: true,
      message: 'Friend request sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Accept friend request
// @route   POST /api/friends/accept/:userId
// @access  Private
exports.acceptFriendRequest = async (req, res) => {
  try {
    const requester = await User.findById(req.params.userId);
    const user = await User.findById(req.user.id);

    if (!requester) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if request exists
    const requestIndex = user.friendRequests.findIndex(
      r => r.from.toString() === req.params.userId
    );

    if (requestIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'No friend request from this user'
      });
    }

    // Remove from requests
    user.friendRequests.splice(requestIndex, 1);

    // Remove from sender's sent requests
    const sentIndex = requester.sentFriendRequests.findIndex(
      r => r.to.toString() === req.user.id
    );
    if (sentIndex > -1) {
      requester.sentFriendRequests.splice(sentIndex, 1);
    }

    // Add as friends
    user.friends.push(req.params.userId);
    requester.friends.push(req.user.id);

    await user.save();
    await requester.save();

    // Create notification
    await Notification.create({
      recipient: req.params.userId,
      sender: req.user.id,
      type: 'friend-accepted',
      content: `${user.firstName} ${user.lastName} accepted your friend request`
    });

    res.json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject friend request
// @route   DELETE /api/friends/reject/:userId
// @access  Private
exports.rejectFriendRequest = async (req, res) => {
  try {
    const requester = await User.findById(req.params.userId);
    const user = await User.findById(req.user.id);

    // Remove from requests
    user.friendRequests = user.friendRequests.filter(
      r => r.from.toString() !== req.params.userId
    );
    await user.save();

    // Remove from sender's sent requests
    if (requester) {
      requester.sentFriendRequests = requester.sentFriendRequests.filter(
        r => r.to.toString() !== req.user.id
      );
      await requester.save();
    }

    res.json({
      success: true,
      message: 'Friend request rejected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel friend request
// @route   DELETE /api/friends/cancel/:userId
// @access  Private
exports.cancelFriendRequest = async (req, res) => {
  try {
    const recipient = await User.findById(req.params.userId);
    const user = await User.findById(req.user.id);

    // Remove from sent requests
    user.sentFriendRequests = user.sentFriendRequests.filter(
      r => r.to.toString() !== req.params.userId
    );
    await user.save();

    // Remove from recipient's requests
    if (recipient) {
      recipient.friendRequests = recipient.friendRequests.filter(
        r => r.from.toString() !== req.user.id
      );
      await recipient.save();
    }

    res.json({
      success: true,
      message: 'Friend request cancelled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unfriend user
// @route   DELETE /api/friends/:userId
// @access  Private
exports.unfriend = async (req, res) => {
  try {
    const friend = await User.findById(req.params.userId);
    const user = await User.findById(req.user.id);

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if they are friends
    if (!user.friends.includes(req.params.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not friends with this user'
      });
    }

    // Remove from both friends lists
    user.friends = user.friends.filter(
      f => f.toString() !== req.params.userId
    );
    friend.friends = friend.friends.filter(
      f => f.toString() !== req.user.id
    );

    await user.save();
    await friend.save();

    res.json({
      success: true,
      message: 'Unfriended successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get friend requests
// @route   GET /api/friends/requests
// @access  Private
exports.getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friendRequests.from', 'firstName lastName profilePicture bio');

    res.json({
      success: true,
      requests: user.friendRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get sent friend requests
// @route   GET /api/friends/sent
// @access  Private
exports.getSentRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('sentFriendRequests.to', 'firstName lastName profilePicture bio');

    res.json({
      success: true,
      requests: user.sentFriendRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get friends list
// @route   GET /api/friends
// @access  Private
exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'firstName lastName profilePicture bio isOnline lastSeen');

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

// @desc    Get mutual friends
// @route   GET /api/friends/mutual/:userId
// @access  Private
exports.getMutualFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const otherUser = await User.findById(req.params.userId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const mutualFriendIds = user.friends.filter(
      friendId => otherUser.friends.some(
        otherId => otherId.toString() === friendId.toString()
      )
    );

    const mutualFriends = await User.find({
      _id: { $in: mutualFriendIds }
    }).select('firstName lastName profilePicture');

    res.json({
      success: true,
      mutualFriends,
      count: mutualFriends.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
