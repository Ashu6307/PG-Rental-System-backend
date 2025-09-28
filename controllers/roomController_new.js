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
    console.log('getAllRooms API called with location filter:', req.locationInfo);
    
    // TODO: REMOVE THIS MOCK DATA IN PRODUCTION - FOR TESTING ONLY
    const mockRooms = [
      {
        _id: "mock1",
        title: "Modern 2BHK in Delhi",
        description: "Beautiful 2BHK apartment in prime location",
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
        createdAt: new Date()
      },
      {
        _id: "mock2", 
        title: "Cozy 1BHK in Mumbai",
        description: "Comfortable 1BHK near beach",
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
        createdAt: new Date()
      },
      {
        _id: "mock3",
        title: "Spacious 3BHK in Bangalore", 
        description: "Luxurious 3BHK in tech hub",
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
        createdAt: new Date()
      }
    ];

    const { city } = req.query;
    let filteredRooms = mockRooms;
    
    // Apply city filter if provided and not "All Cities"
    if (city && city !== 'All Cities') {
      filteredRooms = mockRooms.filter(room => 
        room.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    console.log(`Returning ${filteredRooms.length} mock rooms for city: ${city || 'all'}`);

    res.status(200).json({
      success: true,
      data: filteredRooms,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: filteredRooms.length,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPrevPage: false
      },
      filters: {
        appliedLocation: req.locationInfo || null,
        city: city || null
      },
      stats: {
        totalInLocation: filteredRooms.length,
        avgPrice: filteredRooms.length > 0 ? Math.round(filteredRooms.reduce((sum, room) => sum + room.pricing.rent, 0) / filteredRooms.length) : 0
      }
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
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('owner', 'name email phone businessType')
      .lean();

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: room
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
