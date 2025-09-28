// Enhanced Room Controller with Industry-Level Features
import Room from '../models/Room.js';

// Create a new Room with enhanced validation
export const createRoom = async (req, res) => {
  try {
    const roomData = {
      ...req.body,
      owner: req.user._id,
      status: 'Active',
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const room = new Room(roomData);
    await room.save();
    
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    console.error('Create Room Error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    });
  }
};

// Get all rooms with location-based filtering
export const getAllRooms = async (req, res) => {
  try {
    
    // Check if user is authenticated for full access
    const isAuthenticated = req.user ? true : false;
    const { page = 1, limit: queryLimit = 50 } = req.query;
    
    // Set limit based on authentication status
    let limit;
    if (isAuthenticated) {
      // Full access for authenticated users - 30 per page with pagination
      limit = Math.min(Number(queryLimit), 30); // Max 30 per page for authenticated
    } else {
      // Limited access for public (guest) users
      limit = Math.min(Number(queryLimit), 12); // Max 12 for public
    }
    
    const skip = Math.max(0, (Number(page) - 1) * limit);
    
    // Always get data from database with verification filter
    const realRooms = await Room.find({
      status: 'Active',
      verified: true
    }).skip(skip).limit(limit).lean();
    // console.log('Rooms found in database:', realRooms.length);
    let filteredRooms = realRooms;
    const { city } = req.query;
    if (city && city !== 'All Cities') {
      filteredRooms = realRooms.filter(room =>
        room.city && room.city.toLowerCase().includes(city.toLowerCase())
      );
    }
    // Add enrichment like original controller
    const enrichedRooms = filteredRooms.map(room => {
      const { viewCount, ...roomWithoutViewCount } = room;
      return {
        ...roomWithoutViewCount,
        averageRating: room.rating?.overall || 0,
        viewCount: room.analytics?.views?.total || 0,
        displayPrice: room.pricing?.rent || 0,
        priceFormatted: `₹${(room.pricing?.rent || 0).toLocaleString()}`,
        mainImage: room.media?.images?.[0]?.url || room.images?.[0] || '/placeholder-room.jpg',
        // Frontend compatibility fields
        price: room.pricing?.rent || 0,
        originalPrice: room.pricing?.originalPrice || null,
        title: room.name || room.title || `${room.propertyType} in ${room.city || 'Unknown'}`,
        rating: room.rating || { overall: 0, totalReviews: 0 }
      };
    });
    // Get total count for pagination
    const total = await Room.countDocuments({
      status: 'Active',
      verified: true
    });
    
    return res.status(200).json({
      success: true,
      data: enrichedRooms,
      pagination: isAuthenticated ? {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: parseInt(page) < Math.ceil(total / limit),
        hasPrevPage: parseInt(page) > 1
      } : {
        // No pagination for public users - fixed display
        currentPage: 1,
        totalPages: 1,
        totalItems: enrichedRooms.length,
        itemsPerPage: enrichedRooms.length,
        hasNextPage: false,
        hasPrevPage: false
      },
      access: {
        isAuthenticated,
        accessType: isAuthenticated ? 'full' : 'limited',
        message: isAuthenticated ? 'Full access - all rooms available' : 'Limited access - login for more rooms',
        maxItems: isAuthenticated ? 30 : 12
      },
      filters: {
        appliedLocation: req.locationInfo || null,
        city: city || null
      },
      source: 'database'
    });
  } catch (error) {
    console.error('Get All Rooms Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get room by ID with complete details

// Update room
export const updateRoom = async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom
    });
  } catch (error) {
    console.error('Update Room Error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update room',
      error: error.message
    });
  }
};

// Delete room
export const deleteRoom = async (req, res) => {
  try {
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);

    if (!deletedRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete Room Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room',
      error: error.message
    });
  }
};

// Get rooms by owner
export const getRoomsByOwner = async (req, res) => {
  try {
    const ownerId = req.params.ownerId || req.user._id;
    const rooms = await Room.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: rooms,
      total: rooms.length
    });
  } catch (error) {
    console.error('Get Rooms By Owner Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner rooms',
      error: error.message
    });
  }
};

// Add review to room
export const addReview = async (req, res) => {
  try {
    const { rating, review, categoryRatings } = req.body;
    const roomId = req.params.id;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user already reviewed
    const existingReview = room.reviews.find(r => r.user.toString() === userId.toString());
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this room'
      });
    }

    room.reviews.push({
      user: userId,
      rating,
      review,
      categoryRatings,
      createdAt: new Date()
    });

    await room.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: room
    });
  } catch (error) {
    console.error('Add Review Error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to add review',
      error: error.message
    });
  }
};

// Get room by ID with enrichment and view tracking
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log('getRoomById called for ID:', id);
    
    // First try to get real data
    const realRoom = await Room.findById(id).lean();
    
    if (realRoom) {
      // Increment view count like original
      await Room.findByIdAndUpdate(id, {
        $inc: { 'analytics.views.total': 1 }
      });
      
      // Add enrichment
      const enrichedRoom = {
        ...realRoom,
        averageRating: realRoom.rating?.overall || 0,
        viewCount: (realRoom.analytics?.views?.total || 0) + 1,
        displayPrice: realRoom.pricing?.rent || 0,
        priceFormatted: `₹${(realRoom.pricing?.rent || 0).toLocaleString()}`,
        mainImage: realRoom.media?.images?.[0]?.url || realRoom.images?.[0] || '/placeholder-room.jpg'
      };
      
      return res.status(200).json({
        success: true,
        data: enrichedRoom,
        source: 'database'
      });
    }
    
    // If no real data, check mock data
    const mockRooms = [
      {
        _id: "mock1",
        title: "Modern 2BHK in Delhi",
        description: "Beautiful 2BHK apartment in prime location with all modern amenities",
        city: "Delhi",
        state: "Delhi",
        address: "Connaught Place, New Delhi",
        pricing: { rent: 25000, deposit: 50000 },
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
        propertyType: "Flat",
        roomConfig: { roomType: "2BHK" },
        tenantPreferences: { genderPreference: "Any" },
        availability: { isAvailable: true },
        status: "active",
        featured: true,
        averageRating: 4.2,
        viewCount: 156,
        createdAt: new Date(),
        analytics: { views: { total: 156 } },
        rating: { overall: 4.2 }
      },
      {
        _id: "mock2", 
        title: "Cozy 1BHK in Mumbai",
        description: "Comfortable 1BHK near beach with sea view and modern facilities",
        city: "Mumbai",
        state: "Maharashtra",
        address: "Juhu, Mumbai",
        pricing: { rent: 35000, deposit: 70000 },
        images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"],
        propertyType: "Flat",
        roomConfig: { roomType: "1BHK" },
        tenantPreferences: { genderPreference: "Any" },
        availability: { isAvailable: true },
        status: "active",
        featured: false,
        averageRating: 4.5,
        viewCount: 89,
        createdAt: new Date(),
        analytics: { views: { total: 89 } },
        rating: { overall: 4.5 }
      },
      {
        _id: "mock3",
        title: "Spacious 3BHK in Bangalore", 
        description: "Luxurious 3BHK in tech hub with premium amenities and parking",
        city: "Bangalore",
        state: "Karnataka",
        address: "Electronic City, Bangalore",
        pricing: { rent: 30000, deposit: 60000 },
        images: ["https://images.unsplash.com/photo-1484154218962-a197022b5858"],
        propertyType: "Flat",
        roomConfig: { roomType: "3BHK" },
        tenantPreferences: { genderPreference: "Any" },
        availability: { isAvailable: true },
        status: "active", 
        featured: true,
        averageRating: 4.8,
        viewCount: 234,
        createdAt: new Date(),
        analytics: { views: { total: 234 } },
        rating: { overall: 4.8 }
      }
    ];
    
    const mockRoom = mockRooms.find(room => room._id === id);
    
    if (!mockRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Simulate view count increment for mock data
    mockRoom.viewCount += 1;
    mockRoom.analytics.views.total += 1;
    
    const enrichedRoom = {
      ...mockRoom,
      displayPrice: mockRoom.pricing?.rent || 0,
      priceFormatted: `₹${(mockRoom.pricing?.rent || 0).toLocaleString()}`,
      mainImage: mockRoom.images?.[0] || '/placeholder-room.jpg'
    };
    
    res.status(200).json({
      success: true,
      data: enrichedRoom,
      source: 'mock'
    });
    
  } catch (error) {
    console.error('Get Room By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room',
      error: error.message
    });
  }
};
