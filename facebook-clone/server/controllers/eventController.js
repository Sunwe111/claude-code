const Event = require('../models/Event');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create event
// @route   POST /api/events
// @access  Private
exports.createEvent = async (req, res) => {
  try {
    const {
      name, description, startDate, endDate, timezone,
      isAllDay, location, privacy, category, ticketInfo
    } = req.body;

    const eventData = {
      name,
      description,
      startDate,
      endDate,
      timezone,
      isAllDay,
      location,
      privacy: privacy || 'public',
      category: category || 'social',
      ticketInfo,
      creator: req.user.id,
      hosts: [req.user.id],
      going: [req.user.id],
      goingCount: 1
    };

    if (req.file) {
      eventData.coverPhoto = `/uploads/covers/${req.file.filename}`;
    }

    const event = await Event.create(eventData);
    await event.populate('creator', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get events
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, date, search } = req.query;

    const query = {
      privacy: 'public',
      startDate: { $gte: new Date() },
      isCancelled: false
    };

    if (category) query.category = category;
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query.startDate = { $gte: startOfDay, $lt: endOfDay };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query)
      .populate('creator', 'firstName lastName profilePicture')
      .populate('hosts', 'firstName lastName profilePicture')
      .sort('startDate')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      events,
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

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'firstName lastName profilePicture')
      .populate('hosts', 'firstName lastName profilePicture')
      .populate('going', 'firstName lastName profilePicture')
      .populate('interested', 'firstName lastName profilePicture');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Host only)
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.hosts.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const allowedFields = [
      'name', 'description', 'startDate', 'endDate',
      'timezone', 'isAllDay', 'location', 'privacy',
      'category', 'ticketInfo'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    event = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    // Notify attendees of changes
    const attendees = [...event.going, ...event.interested];
    const notifications = attendees
      .filter(id => id.toString() !== req.user.id)
      .map(userId => ({
        recipient: userId,
        sender: req.user.id,
        type: 'event-reminder',
        content: `${event.name} has been updated`,
        reference: { event: event._id }
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    RSVP to event
// @route   POST /api/events/:id/rsvp
// @access  Private
exports.rsvpEvent = async (req, res) => {
  try {
    const { status } = req.body; // 'going', 'interested', 'not-going'
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Remove from all lists first
    event.going = event.going.filter(id => id.toString() !== req.user.id);
    event.interested = event.interested.filter(id => id.toString() !== req.user.id);
    event.declined = event.declined.filter(id => id.toString() !== req.user.id);

    // Add to appropriate list
    if (status === 'going') {
      event.going.push(req.user.id);
    } else if (status === 'interested') {
      event.interested.push(req.user.id);
    } else if (status === 'not-going') {
      event.declined.push(req.user.id);
    }

    event.goingCount = event.going.length;
    event.interestedCount = event.interested.length;

    await event.save();

    res.json({
      success: true,
      status,
      goingCount: event.goingCount,
      interestedCount: event.interestedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Invite users to event
// @route   POST /api/events/:id/invite
// @access  Private
exports.inviteToEvent = async (req, res) => {
  try {
    const { userIds } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const newInvites = userIds.filter(userId => {
      const isAlreadyInvited = event.invited.some(
        i => i.user.toString() === userId
      );
      const isAlreadyGoing = event.going.includes(userId);
      const isInterested = event.interested.includes(userId);
      return !isAlreadyInvited && !isAlreadyGoing && !isInterested;
    });

    newInvites.forEach(userId => {
      event.invited.push({
        user: userId,
        invitedBy: req.user.id
      });
    });

    await event.save();

    // Send notifications
    const notifications = newInvites.map(userId => ({
      recipient: userId,
      sender: req.user.id,
      type: 'event-invite',
      content: `${req.user.firstName} ${req.user.lastName} invited you to ${event.name}`,
      reference: { event: event._id }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({
      success: true,
      message: `${newInvites.length} invitations sent`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel event
// @route   PUT /api/events/:id/cancel
// @access  Private (Creator only)
exports.cancelEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can cancel the event'
      });
    }

    event.isCancelled = true;
    await event.save();

    // Notify all attendees
    const attendees = [...event.going, ...event.interested];
    const notifications = attendees.map(userId => ({
      recipient: userId,
      sender: req.user.id,
      type: 'event-reminder',
      content: `${event.name} has been cancelled`,
      reference: { event: event._id }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({
      success: true,
      message: 'Event cancelled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's events
// @route   GET /api/events/my-events
// @access  Private
exports.getMyEvents = async (req, res) => {
  try {
    const { type } = req.query; // 'hosting', 'going', 'interested', 'past'

    let query = {};

    if (type === 'hosting') {
      query = { hosts: req.user.id };
    } else if (type === 'going') {
      query = { going: req.user.id };
    } else if (type === 'interested') {
      query = { interested: req.user.id };
    } else if (type === 'past') {
      query = {
        $or: [{ going: req.user.id }, { hosts: req.user.id }],
        startDate: { $lt: new Date() }
      };
    } else {
      query = {
        $or: [
          { hosts: req.user.id },
          { going: req.user.id },
          { interested: req.user.id }
        ]
      };
    }

    if (type !== 'past') {
      query.startDate = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate('creator', 'firstName lastName profilePicture')
      .sort('startDate');

    res.json({
      success: true,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Creator only)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can delete the event'
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
