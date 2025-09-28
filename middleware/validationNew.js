// Enhanced Room/Flat validation middleware with industry standards
import Joi from 'joi';

// Enhanced Room/Flat validation schema based on industry standards
const roomValidationSchema = Joi.object({
  // Basic Information
  name: Joi.string().min(3).max(100).required()
    .messages({
      'string.min': 'Property name must be at least 3 characters long',
      'string.max': 'Property name cannot exceed 100 characters',
      'any.required': 'Property name is required'
    }),
  
  description: Joi.string().min(20).max(2000).required()
    .messages({
      'string.min': 'Description must be at least 20 characters long',
      'string.max': 'Description cannot exceed 2000 characters',
      'any.required': 'Property description is required'
    }),
  
  propertyType: Joi.string().valid('Room', 'Flat').required()
    .messages({
      'any.only': 'Property type must be either Room or Flat',
      'any.required': 'Property type is required'
    }),
  
  // Location Information
  address: Joi.string().min(10).max(300).required()
    .messages({
      'string.min': 'Address must be at least 10 characters long',
      'string.max': 'Address cannot exceed 300 characters',
      'any.required': 'Property address is required'
    }),
  
  city: Joi.string().min(2).max(50).required()
    .messages({
      'string.min': 'City name must be at least 2 characters long',
      'string.max': 'City name cannot exceed 50 characters',
      'any.required': 'City is required'
    }),
  
  state: Joi.string().min(2).max(50).required()
    .messages({
      'string.min': 'State name must be at least 2 characters long',
      'string.max': 'State name cannot exceed 50 characters',
      'any.required': 'State is required'
    }),
  
  pincode: Joi.string().pattern(/^[0-9]{6}$/).required()
    .messages({
      'string.pattern.base': 'Pincode must be a 6-digit number',
      'any.required': 'Pincode is required'
    }),
  
  locality: Joi.string().min(2).max(100).required()
    .messages({
      'string.min': 'Locality must be at least 2 characters long',
      'string.max': 'Locality cannot exceed 100 characters',
      'any.required': 'Locality is required'
    }),
  
  subLocality: Joi.string().max(100).optional(),
  
  landmarks: Joi.array().items(Joi.string().max(100)).max(5).optional(),
  
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
      .messages({
        'array.length': 'Coordinates must contain exactly 2 values [longitude, latitude]',
        'any.required': 'Location coordinates are required'
      })
  }).required(),
  
  // Pricing Structure
  pricing: Joi.object({
    rent: Joi.number().min(500).max(500000).required()
      .messages({
        'number.min': 'Rent must be at least ₹500',
        'number.max': 'Rent cannot exceed ₹5,00,000',
        'any.required': 'Monthly rent is required'
      }),
    
    securityDeposit: Joi.number().min(0).max(1000000).required()
      .messages({
        'number.min': 'Security deposit cannot be negative',
        'number.max': 'Security deposit cannot exceed ₹10,00,000',
        'any.required': 'Security deposit amount is required'
      }),
    
    maintenanceCharges: Joi.number().min(0).max(50000).optional(),
    electricityCharges: Joi.string().valid('Included', 'Extra', 'Per Unit').default('Extra'),
    waterCharges: Joi.string().valid('Included', 'Extra').default('Included'),
    internetCharges: Joi.number().min(0).max(5000).optional(),
    parkingCharges: Joi.number().min(0).max(10000).optional(),
    brokerageCharges: Joi.number().min(0).max(100000).optional(),
    
    additionalCharges: Joi.array().items(
      Joi.object({
        name: Joi.string().max(50).required(),
        amount: Joi.number().min(0).max(50000).required(),
        frequency: Joi.string().valid('Monthly', 'Quarterly', 'Yearly', 'One-time').default('Monthly')
      })
    ).max(10).optional()
  }).required(),
  
  // Units and Availability
  totalUnits: Joi.number().min(1).max(1000).required()
    .messages({
      'number.min': 'Must have at least 1 unit',
      'number.max': 'Cannot exceed 1000 units',
      'any.required': 'Total units is required'
    }),
  
  availableUnits: Joi.number().min(0).required()
    .messages({
      'number.min': 'Available units cannot be negative',
      'any.required': 'Available units count is required'
    }),
  
  // Conditional validation based on property type
  roomConfig: Joi.when('propertyType', {
    is: 'Room',
    then: Joi.object({
      roomType: Joi.string().valid('Single', 'Double', 'Triple', 'Shared', 'Private').required(),
      area: Joi.number().min(50).max(500).required(),
      furnished: Joi.boolean().default(false),
      attachedBathroom: Joi.boolean().default(false),
      balcony: Joi.boolean().default(false),
      floor: Joi.number().min(0).max(50).required(),
      facing: Joi.string().valid('North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West').optional(),
      windowType: Joi.string().valid('No Window', 'Single Window', 'Multiple Windows', 'French Window').optional(),
      acType: Joi.string().valid('None', 'Window AC', 'Split AC', 'Central AC').default('None')
    }).required(),
    otherwise: Joi.forbidden()
  }),
  
  flatConfig: Joi.when('propertyType', {
    is: 'Flat',
    then: Joi.object({
      flatType: Joi.string().valid('1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+').required(),
      bedrooms: Joi.number().min(0).max(10).required(),
      bathrooms: Joi.number().min(1).max(10).required(),
      halls: Joi.number().min(0).max(5).required(),
      kitchens: Joi.number().min(0).max(3).required(),
      balconies: Joi.number().min(0).max(10).required(),
      
      areas: Joi.object({
        carpetArea: Joi.number().min(100).max(10000).required(),
        builtUpArea: Joi.number().min(150).max(15000).optional(),
        superBuiltUpArea: Joi.number().min(200).max(20000).optional()
      }).required(),
      
      floor: Joi.number().min(0).max(100).required(),
      totalFloors: Joi.number().min(1).max(100).required(),
      
      furnishingStatus: Joi.string().valid('Unfurnished', 'Semi-Furnished', 'Fully-Furnished').required(),
      
      ageOfProperty: Joi.string().valid('Under Construction', '0-1 years', '1-5 years', '5-10 years', '10-15 years', '15+ years').required(),
      
      facing: Joi.string().valid('North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West').optional(),
      
      parkingSpaces: Joi.object({
        covered: Joi.number().min(0).max(10).default(0),
        open: Joi.number().min(0).max(10).default(0)
      }).optional()
    }).required(),
    otherwise: Joi.forbidden()
  }),
  
  // Amenities
  amenities: Joi.object({
    basic: Joi.object({
      wifi: Joi.boolean().default(false),
      parking: Joi.boolean().default(false),
      powerBackup: Joi.boolean().default(false),
      waterSupply: Joi.boolean().default(false),
      security: Joi.boolean().default(false),
      lift: Joi.boolean().default(false),
      cctv: Joi.boolean().default(false),
      fireExtinguisher: Joi.boolean().default(false)
    }).default({}),
    
    room: Joi.object({
      ac: Joi.boolean().default(false),
      geyser: Joi.boolean().default(false),
      bed: Joi.boolean().default(false),
      wardrobe: Joi.boolean().default(false),
      studyTable: Joi.boolean().default(false),
      chair: Joi.boolean().default(false),
      fan: Joi.boolean().default(false),
      light: Joi.boolean().default(false),
      curtains: Joi.boolean().default(false),
      mirror: Joi.boolean().default(false)
    }).default({}),
    
    kitchen: Joi.object({
      modularKitchen: Joi.boolean().default(false),
      refrigerator: Joi.boolean().default(false),
      microwave: Joi.boolean().default(false),
      gasConnection: Joi.boolean().default(false),
      waterPurifier: Joi.boolean().default(false),
      dishwasher: Joi.boolean().default(false),
      washingMachine: Joi.boolean().default(false),
      kitchenUtensils: Joi.boolean().default(false)
    }).default({}),
    
    society: Joi.object({
      gym: Joi.boolean().default(false),
      swimming: Joi.boolean().default(false),
      garden: Joi.boolean().default(false),
      playground: Joi.boolean().default(false),
      clubhouse: Joi.boolean().default(false),
      commonArea: Joi.boolean().default(false),
      rooftop: Joi.boolean().default(false),
      visitorsParking: Joi.boolean().default(false)
    }).default({}),
    
    services: Joi.object({
      housekeeping: Joi.boolean().default(false),
      laundry: Joi.boolean().default(false),
      foodService: Joi.boolean().default(false),
      maintenance: Joi.boolean().default(false),
      securityGuard: Joi.boolean().default(false),
      reception: Joi.boolean().default(false)
    }).default({})
  }).default({}),
  
  // Media
  media: Joi.object({
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        caption: Joi.string().max(100).optional(),
        category: Joi.string().valid('Exterior', 'Room', 'Kitchen', 'Bathroom', 'Common Area', 'Amenities', 'Nearby').default('Room'),
        isPrimary: Joi.boolean().default(false)
      })
    ).min(1).max(20).required()
      .messages({
        'array.min': 'At least 1 image is required',
        'array.max': 'Maximum 20 images allowed'
      }),
    
    videos: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        title: Joi.string().max(100).optional(),
        duration: Joi.number().min(1).max(300).optional() // in seconds
      })
    ).max(3).optional(),
    
    virtualTour: Joi.object({
      url: Joi.string().uri().optional(),
      provider: Joi.string().valid('360', 'Matterport', 'Other').optional()
    }).optional()
  }).required(),
  
  // Contact Information
  contact: Joi.object({
    primaryPhone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
      .messages({
        'string.pattern.base': 'Primary phone must be a valid 10-digit Indian mobile number',
        'any.required': 'Primary phone number is required'
      }),
    
    secondaryPhone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    whatsappNumber: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    email: Joi.string().email().optional(),
    
    availability: Joi.object({
      callTime: Joi.object({
        start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),
        end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('21:00')
      }).default({}),
      
      days: Joi.array().items(
        Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
      ).min(1).default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
      
      preferredContactMethod: Joi.string().valid('Phone', 'WhatsApp', 'Email').default('Phone')
    }).default({})
  }).required(),
  
  // Tenant Preferences
  tenantPreferences: Joi.object({
    genderPreference: Joi.string().valid('Male', 'Female', 'Any').default('Any'),
    occupationType: Joi.string().valid('Students', 'Working Professionals', 'Family', 'Any').default('Any'),
    ageGroup: Joi.string().valid('18-25', '25-35', '35-45', '45+', 'Any').default('Any'),
    foodHabits: Joi.string().valid('Vegetarian', 'Non-Vegetarian', 'Any').default('Any'),
    smokingAllowed: Joi.boolean().default(false),
    drinkingAllowed: Joi.boolean().default(false),
    petsAllowed: Joi.boolean().default(false),
    guestsAllowed: Joi.boolean().default(true),
    maximumOccupancy: Joi.number().min(1).max(20).optional()
  }).default({}),
  
  // Tenant Rules
  tenantRules: Joi.object({
    noSmoking: Joi.boolean().default(true),
    noDrinking: Joi.boolean().default(false),
    noPets: Joi.boolean().default(false),
    noLoudMusic: Joi.boolean().default(true),
    noParties: Joi.boolean().default(true),
    gateClosingTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    visitorsPolicy: Joi.string().max(200).optional(),
    additionalRules: Joi.array().items(Joi.string().max(100)).max(10).optional()
  }).default({}),
  
  // Property Status
  propertyStatus: Joi.object({
    listingStatus: Joi.string().valid('Active', 'Inactive', 'Rented', 'Maintenance').default('Active'),
    verified: Joi.boolean().default(false),
    featured: Joi.boolean().default(false),
    premium: Joi.boolean().default(false),
    qualityScore: Joi.number().min(0).max(100).default(0)
  }).default({})
});

// Validation middleware
export const validateRoom = (req, res, next) => {
  const { error, value } = roomValidationSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  // Additional custom validations
  
  // Validate available units doesn't exceed total units
  if (value.availableUnits > value.totalUnits) {
    return res.status(400).json({
      success: false,
      message: 'Available units cannot exceed total units'
    });
  }
  
  // Validate flat configuration for flats
  if (value.propertyType === 'Flat' && value.flatConfig) {
    if (value.flatConfig.floor > value.flatConfig.totalFloors) {
      return res.status(400).json({
        success: false,
        message: 'Floor number cannot exceed total floors'
      });
    }
    
    if (value.flatConfig.areas.carpetArea > value.flatConfig.areas.builtUpArea) {
      return res.status(400).json({
        success: false,
        message: 'Carpet area cannot exceed built-up area'
      });
    }
  }

  req.body = value;
  next();
};

// Room update validation (allows partial updates)
export const validateRoomUpdate = (req, res, next) => {
  const updateSchema = roomValidationSchema.fork(
    ['name', 'description', 'propertyType', 'address', 'city', 'state', 'pincode', 'locality', 'location', 'pricing', 'totalUnits', 'availableUnits', 'media', 'contact'],
    (schema) => schema.optional()
  );

  const { error, value } = updateSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  req.body = value;
  next();
};

// Search filters validation
export const validateSearchFilters = (req, res, next) => {
  const searchSchema = Joi.object({
    city: Joi.string().max(50).optional(),
    locality: Joi.string().max(100).optional(),
    propertyType: Joi.string().valid('Room', 'Flat').optional(),
    minRent: Joi.number().min(0).optional(),
    maxRent: Joi.number().min(0).optional(),
    
    // Room specific filters
    roomType: Joi.string().valid('Single', 'Double', 'Triple', 'Shared', 'Private').optional(),
    furnished: Joi.boolean().optional(),
    
    // Flat specific filters
    flatType: Joi.string().valid('1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+').optional(),
    bedrooms: Joi.number().min(0).max(10).optional(),
    furnishingStatus: Joi.string().valid('Unfurnished', 'Semi-Furnished', 'Fully-Furnished').optional(),
    
    // Common filters
    genderPreference: Joi.string().valid('Male', 'Female', 'Any').optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    availableOnly: Joi.boolean().optional(),
    verifiedOnly: Joi.boolean().optional(),
    
    // Location-based search
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    radius: Joi.number().min(100).max(50000).default(5000).optional(), // in meters
    
    // Sorting and pagination
    sortBy: Joi.string().valid('price', 'rating', 'distance', 'featured', 'newest').default('featured').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional(),
    page: Joi.number().min(1).default(1).optional(),
    limit: Joi.number().min(1).max(50).default(10).optional()
  }).and('latitude', 'longitude'); // Both lat and lng required together

  const { error, value } = searchSchema.validate(req.query, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Invalid search parameters',
      errors: errorMessages
    });
  }

  // Validate price range
  if (value.minRent && value.maxRent && value.minRent > value.maxRent) {
    return res.status(400).json({
      success: false,
      message: 'Minimum rent cannot be greater than maximum rent'
    });
  }

  req.query = value;
  next();
};
