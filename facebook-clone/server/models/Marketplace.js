const mongoose = require('mongoose');

const marketplaceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    maxLength: 5000
  },
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    negotiable: {
      type: Boolean,
      default: false
    },
    isFree: {
      type: Boolean,
      default: false
    }
  },
  images: [{
    url: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: String,
    enum: [
      'vehicles', 'property-rentals', 'electronics', 'apparel',
      'classifieds', 'entertainment', 'family', 'free-stuff',
      'garden-outdoor', 'hobbies', 'home-goods', 'home-improvement',
      'home-sales', 'musical-instruments', 'office-supplies',
      'pet-supplies', 'sporting-goods', 'toys-games', 'other'
    ],
    required: true
  },
  subcategory: String,
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  shippingOptions: {
    localPickup: {
      type: Boolean,
      default: true
    },
    shipping: {
      type: Boolean,
      default: false
    },
    shippingCost: Number
  },
  availability: {
    type: String,
    enum: ['available', 'pending', 'sold'],
    default: 'available'
  },
  views: {
    type: Number,
    default: 0
  },
  saves: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  inquiries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  // Vehicle specific fields
  vehicleDetails: {
    make: String,
    model: String,
    year: Number,
    mileage: Number,
    fuelType: String,
    transmission: String,
    color: String,
    vin: String
  },
  // Property specific fields
  propertyDetails: {
    propertyType: String,
    bedrooms: Number,
    bathrooms: Number,
    squareFeet: Number,
    parkingSpaces: Number,
    petsAllowed: Boolean,
    laundry: String,
    availableDate: Date
  },
  isBoosted: {
    type: Boolean,
    default: false
  },
  boostExpires: Date,
  reportCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

marketplaceSchema.index({ title: 'text', description: 'text' });
marketplaceSchema.index({ category: 1 });
marketplaceSchema.index({ 'price.amount': 1 });
marketplaceSchema.index({ 'location.city': 1 });
marketplaceSchema.index({ availability: 1 });
marketplaceSchema.index({ seller: 1 });

module.exports = mongoose.model('Marketplace', marketplaceSchema);
