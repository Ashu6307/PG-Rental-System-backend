import express from 'express';
import Offer from '../models/Offer.js';

const router = express.Router();

// Dynamic offers endpoint for user dashboard
router.get('/', async (req, res) => {
  try {
    // Get query parameters for filtering
    const { type, active, limit = 10 } = req.query;
    
    // Build filter criteria
    const filter = {
      isActive: true,
      validUntil: { $gte: new Date() } // Only show non-expired offers
    };
    
    // Add type filter if specified
    if (type && ['pg', 'room', 'both'].includes(type)) {
      filter.type = type;
    }
    
    // Add active filter if specified
    if (active !== undefined) {
      filter.active = active === 'true';
    }
    
    // Fetch offers from database
    const offers = await Offer.find(filter)
      .sort({ createdAt: -1 }) // Latest offers first
      .limit(parseInt(limit))
      .select('-createdBy -__v') // Exclude sensitive fields
      .lean(); // Convert to plain JavaScript objects for better performance
    
    // Transform data to ensure compatibility with frontend
    const transformedOffers = offers.map(offer => ({
      id: offer._id.toString(),
      title: offer.title || offer.name,
      description: offer.description,
      discount: offer.discount,
      validUntil: offer.validUntil,
      type: offer.type,
      active: offer.isActive,
      imageUrl: offer.imageUrl || (offer.images && offer.images[0]) || null,
      images: offer.images || [],
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt
    }));
    
    res.json({ 
      success: true, 
      offers: transformedOffers,
      count: transformedOffers.length,
      message: transformedOffers.length === 0 ? 'No active offers available' : `Found ${transformedOffers.length} offers`
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch offers',
      message: error.message,
      offers: []
    });
  }
});

// Get specific offer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const offer = await Offer.findById(id)
      .select('-createdBy -__v')
      .lean();
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        error: 'Offer not found',
        message: 'The requested offer does not exist'
      });
    }
    
    // Check if offer is expired
    if (new Date(offer.validUntil) < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Offer expired',
        message: 'This offer has expired'
      });
    }
    
    // Transform data
    const transformedOffer = {
      id: offer._id.toString(),
      title: offer.title || offer.name,
      description: offer.description,
      discount: offer.discount,
      validUntil: offer.validUntil,
      type: offer.type,
      active: offer.isActive,
      imageUrl: offer.imageUrl || (offer.images && offer.images[0]) || null,
      images: offer.images || [],
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt
    };
    
    res.json({
      success: true,
      offer: transformedOffer
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offer',
      message: error.message
    });
  }
});

export default router;
