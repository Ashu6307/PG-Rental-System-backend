// Room Routes - Complete API endpoints for Room management
import express from 'express';
import Room from '../models/Room.js';
import {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getRoomsByOwner,
  addReview
} from '../controllers/roomController.js';
import { authenticate, authorize, addLocationFilter, optionalAuth } from '../middleware/auth.js';
import { validateRoom } from '../middleware/validation.js';

const router = express.Router();

// Public routes with location filtering and optional authentication
router.get('/', optionalAuth, addLocationFilter, getAllRooms); // Apply location middleware
router.get('/:id', getRoomById); // Get room by ID

// Fallback route without middleware for testing
router.get('/all/simple', getAllRooms); // Simple route without location filter

// Protected routes - require authentication
router.use(authenticate);

// Room CRUD operations
router.post('/', authorize(['owner', 'admin']), validateRoom, createRoom);
router.put('/:id', authorize(['owner', 'admin']), updateRoom);
router.delete('/:id', authorize(['owner', 'admin']), deleteRoom);

// Owner-specific routes
router.get('/owner/:ownerId', authorize(['owner', 'admin']), getRoomsByOwner);
router.get('/my/rooms', authorize(['owner']), getRoomsByOwner);

// Review routes
router.post('/:id/reviews', authorize(['user', 'owner']), addReview);

// Area Images Management routes
router.post('/:id/area-images', authorize(['owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { area, imageUrl } = req.body;
    
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this room'
      });
    }

    // Initialize areaImages if not exists
    if (!room.media.areaImages) {
      room.media.areaImages = {
        kitchen: [],
        bedroom: [],
        bathroom: [],
        livingRoom: [],
        balcony: [],
        parking: [],
        entrance: [],
        others: []
      };
    }

    // Add image to specific area
    if (area === 'others') {
      const { label } = req.body;
      if (!label) {
        return res.status(400).json({
          success: false,
          message: 'Label is required for others category'
        });
      }
      
      const existingOther = room.media.areaImages.others.find(item => item.label === label);
      if (existingOther) {
        existingOther.images.push(imageUrl);
      } else {
        room.media.areaImages.others.push({
          label: label,
          images: [imageUrl]
        });
      }
    } else if (room.media.areaImages[area]) {
      room.media.areaImages[area].push(imageUrl);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid area specified'
      });
    }

    room.updatedAt = new Date();
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Area image added successfully',
      data: room.media.areaImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add area image',
      error: error.message
    });
  }
});

router.delete('/:id/area-images', authorize(['owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { area, imageIndex, label } = req.body;
    
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this room'
      });
    }

    // Remove image from specific area
    if (area === 'others') {
      if (!label) {
        return res.status(400).json({
          success: false,
          message: 'Label is required for others category'
        });
      }
      
      const otherItem = room.media.areaImages.others.find(item => item.label === label);
      if (otherItem && otherItem.images[imageIndex]) {
        otherItem.images.splice(imageIndex, 1);
        // Remove the entire item if no images left
        if (otherItem.images.length === 0) {
          room.media.areaImages.others = room.media.areaImages.others.filter(item => item.label !== label);
        }
      }
    } else if (room.media.areaImages[area] && room.media.areaImages[area][imageIndex]) {
      room.media.areaImages[area].splice(imageIndex, 1);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid area or image index specified'
      });
    }

    room.updatedAt = new Date();
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Area image removed successfully',
      data: room.media.areaImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove area image',
      error: error.message
    });
  }
});

// Admin routes
router.get('/admin/all', authorize(['admin']), async (req, res) => {
  try {
    const { status, verified, city, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (verified !== undefined) query.verified = verified === 'true';
    if (city) query.city = new RegExp(city, 'i');

    const skip = (Number(page) - 1) * Number(limit);
    
    const rooms = await Room.find(query)
      .populate('owner', 'name email businessType verified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Room.countDocuments(query);

    res.status(200).json({
      success: true,
      data: rooms,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total
      },
      stats: {
        totalRooms: await Room.countDocuments(),
        activeRooms: await Room.countDocuments({ status: 'Active' }),
        pendingRooms: await Room.countDocuments({ status: 'Pending' }),
        verifiedRooms: await Room.countDocuments({ verified: true })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin room data',
      error: error.message
    });
  }
});

// Admin verification routes
router.patch('/:id/verify', authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, verificationNotes } = req.body;

    const room = await Room.findByIdAndUpdate(
      id,
      {
        verified,
        verificationNotes,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? req.user._id : null
      },
      { new: true }
    ).populate('owner', 'name email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Room ${verified ? 'verified' : 'unverified'} successfully`,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update verification status',
      error: error.message
    });
  }
});

// Admin status update
router.patch('/:id/status', authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusReason } = req.body;

    if (!['Active', 'Inactive', 'Pending', 'Suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const room = await Room.findByIdAndUpdate(
      id,
      {
        status,
        statusReason,
        statusUpdatedBy: req.user._id,
        statusUpdatedAt: new Date()
      },
      { new: true }
    ).populate('owner', 'name email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Room status updated to ${status}`,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update room status',
      error: error.message
    });
  }
});

// Search and filter routes
router.get('/search/advanced', async (req, res) => {
  try {
    const {
      q, // search term
      city,
      minPrice,
      maxPrice,
      roomType,
      amenities,
      genderPreference,
      lat,
      lng,
      radius = 5000,
      sortBy = 'relevance',
      page = 1,
      limit = 10
    } = req.query;

    let query = { status: 'Active', verified: true };
    let sort = {};

    // Text search
    if (q) {
      query.$or = [
        { name: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { address: new RegExp(q, 'i') },
        { city: new RegExp(q, 'i') },
        { 'seo.metaDescription': new RegExp(q, 'i') }
      ];
    }

    // Apply filters
    if (city) query.city = new RegExp(city, 'i');
    if (minPrice && maxPrice) query.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    if (roomType) query.roomType = roomType;
    if (genderPreference) query['rules.genderPreference'] = { $in: [genderPreference, 'Any'] };

    // Amenities filter
    if (amenities) {
      const amenityArray = amenities.split(',');
      query.$or = [
        ...(query.$or || []),
        { 'amenities.basic': { $in: amenityArray } },
        { 'amenities.comfort': { $in: amenityArray } },
        { 'amenities.safety': { $in: amenityArray } }
      ];
    }

    // Location-based search
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius)
        }
      };
    }

    // Sorting logic
    switch (sortBy) {
      case 'price_low':
        sort.price = 1;
        break;
      case 'price_high':
        sort.price = -1;
        break;
      case 'rating':
        sort['analytics.rating'] = -1;
        break;
      case 'newest':
        sort.createdAt = -1;
        break;
      case 'popular':
        sort['analytics.views'] = -1;
        break;
      default:
        sort.searchScore = -1;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const rooms = await Room.find(query)
      .populate('owner', 'name verified businessType')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Room.countDocuments(query);

    res.status(200).json({
      success: true,
      data: rooms,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total
      },
      searchParams: {
        query: q,
        filters: { city, minPrice, maxPrice, roomType, amenities, genderPreference },
        location: lat && lng ? { lat: Number(lat), lng: Number(lng), radius: Number(radius) } : null,
        sortBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Analytics routes for room owners
router.get('/:id/analytics', authorize(['owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check ownership
    if (room.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics'
      });
    }

    const analytics = {
      views: room.analytics.views,
      bookings: room.analytics.bookingCount,
      revenue: room.analytics.revenueGenerated,
      rating: room.analytics.rating,
      reviewCount: room.analytics.reviewCount,
      occupancyRate: room.totalRooms > 0 
        ? (((room.totalRooms - room.availableRooms) / room.totalRooms) * 100).toFixed(1)
        : 0,
      completenessScore: calculateCompleteness(room),
      performance: {
        searchScore: room.searchScore,
        verified: room.verified,
        status: room.status
      }
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

export default router;
