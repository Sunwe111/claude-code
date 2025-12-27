const Marketplace = require('../models/Marketplace');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Create listing
// @route   POST /api/marketplace
// @access  Private
exports.createListing = async (req, res) => {
  try {
    const {
      title, description, price, category, condition,
      location, shippingOptions, tags, vehicleDetails, propertyDetails
    } = req.body;

    const listingData = {
      title,
      description,
      price,
      category,
      condition,
      location,
      shippingOptions,
      tags,
      seller: req.user.id
    };

    // Handle images
    if (req.files && req.files.length > 0) {
      listingData.images = req.files.map((file, index) => ({
        url: `/uploads/marketplace/${file.filename}`,
        isPrimary: index === 0
      }));
    }

    // Category-specific details
    if (category === 'vehicles' && vehicleDetails) {
      listingData.vehicleDetails = vehicleDetails;
    }
    if (category === 'property-rentals' && propertyDetails) {
      listingData.propertyDetails = propertyDetails;
    }

    const listing = await Marketplace.create(listingData);
    await listing.populate('seller', 'firstName lastName profilePicture location');

    res.status(201).json({
      success: true,
      listing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get listings
// @route   GET /api/marketplace
// @access  Private
exports.getListings = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, category, minPrice, maxPrice,
      condition, location, search, sortBy
    } = req.query;

    const query = {
      availability: 'available',
      isActive: true
    };

    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }
    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.amount'].$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'price-low') sort = { 'price.amount': 1 };
    if (sortBy === 'price-high') sort = { 'price.amount': -1 };
    if (sortBy === 'newest') sort = { createdAt: -1 };

    const listings = await Marketplace.find(query)
      .populate('seller', 'firstName lastName profilePicture location')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Marketplace.countDocuments(query);

    res.json({
      success: true,
      listings,
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

// @desc    Get single listing
// @route   GET /api/marketplace/:id
// @access  Private
exports.getListing = async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id)
      .populate('seller', 'firstName lastName profilePicture location createdAt');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Increment views
    if (listing.seller.toString() !== req.user.id) {
      listing.views += 1;
      await listing.save();
    }

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update listing
// @route   PUT /api/marketplace/:id
// @access  Private
exports.updateListing = async (req, res) => {
  try {
    let listing = await Marketplace.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const allowedFields = [
      'title', 'description', 'price', 'condition',
      'location', 'shippingOptions', 'tags', 'availability'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    listing = await Marketplace.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete listing
// @route   DELETE /api/marketplace/:id
// @access  Private
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await listing.deleteOne();

    res.json({
      success: true,
      message: 'Listing deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Save/Unsave listing
// @route   POST /api/marketplace/:id/save
// @access  Private
exports.saveListing = async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const isSaved = listing.saves.includes(req.user.id);

    if (isSaved) {
      listing.saves = listing.saves.filter(id => id.toString() !== req.user.id);
    } else {
      listing.saves.push(req.user.id);
    }

    await listing.save();

    res.json({
      success: true,
      saved: !isSaved
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Contact seller
// @route   POST /api/marketplace/:id/contact
// @access  Private
exports.contactSeller = async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot contact yourself'
      });
    }

    const { message } = req.body;

    // Add to inquiries
    listing.inquiries.push({
      user: req.user.id,
      message
    });
    await listing.save();

    // Create or get conversation
    let conversation = await Conversation.findOne({
      type: 'private',
      participants: { $all: [req.user.id, listing.seller] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, listing.seller],
        type: 'private'
      });
    }

    // Send message with listing info
    const messageContent = `${message}\n\n📦 Regarding: ${listing.title}\n💰 Price: $${listing.price.amount}`;

    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      content: messageContent,
      type: 'text'
    });

    conversation.lastMessage = newMessage._id;
    await conversation.save();

    res.json({
      success: true,
      message: 'Message sent to seller',
      conversationId: conversation._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark as sold
// @route   PUT /api/marketplace/:id/sold
// @access  Private
exports.markAsSold = async (req, res) => {
  try {
    const listing = await Marketplace.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    listing.availability = 'sold';
    await listing.save();

    res.json({
      success: true,
      message: 'Listing marked as sold'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my listings
// @route   GET /api/marketplace/my-listings
// @access  Private
exports.getMyListings = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { seller: req.user.id };
    if (status) query.availability = status;

    const listings = await Marketplace.find(query).sort('-createdAt');

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get saved listings
// @route   GET /api/marketplace/saved
// @access  Private
exports.getSavedListings = async (req, res) => {
  try {
    const listings = await Marketplace.find({
      saves: req.user.id,
      availability: 'available'
    })
      .populate('seller', 'firstName lastName profilePicture')
      .sort('-createdAt');

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get categories
// @route   GET /api/marketplace/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      { id: 'vehicles', name: 'Vehicles', icon: '🚗' },
      { id: 'property-rentals', name: 'Property Rentals', icon: '🏠' },
      { id: 'electronics', name: 'Electronics', icon: '📱' },
      { id: 'apparel', name: 'Apparel', icon: '👕' },
      { id: 'entertainment', name: 'Entertainment', icon: '🎮' },
      { id: 'family', name: 'Family', icon: '👨‍👩‍👧' },
      { id: 'free-stuff', name: 'Free Stuff', icon: '🎁' },
      { id: 'garden-outdoor', name: 'Garden & Outdoor', icon: '🌳' },
      { id: 'hobbies', name: 'Hobbies', icon: '🎨' },
      { id: 'home-goods', name: 'Home Goods', icon: '🏡' },
      { id: 'home-improvement', name: 'Home Improvement', icon: '🔧' },
      { id: 'musical-instruments', name: 'Musical Instruments', icon: '🎸' },
      { id: 'office-supplies', name: 'Office Supplies', icon: '📎' },
      { id: 'pet-supplies', name: 'Pet Supplies', icon: '🐕' },
      { id: 'sporting-goods', name: 'Sporting Goods', icon: '⚽' },
      { id: 'toys-games', name: 'Toys & Games', icon: '🧸' },
      { id: 'other', name: 'Other', icon: '📦' }
    ];

    // Get counts for each category
    const counts = await Marketplace.aggregate([
      { $match: { availability: 'available', isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const countMap = counts.reduce((acc, c) => {
      acc[c._id] = c.count;
      return acc;
    }, {});

    const categoriesWithCounts = categories.map(cat => ({
      ...cat,
      count: countMap[cat.id] || 0
    }));

    res.json({
      success: true,
      categories: categoriesWithCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
