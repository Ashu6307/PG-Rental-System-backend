import express from 'express';
import HeroContent from '../models/HeroContent.js';
import MarketingStat from '../models/MarketingStat.js';
import Testimonial from '../models/Testimonial.js';
import CTAContent from '../models/CTAContent.js';
import FeatureContent from '../models/FeatureContent.js';
import PG from '../models/PG.js';
import Room from '../models/Room.js';
import City from '../models/City.js';

const router = express.Router();

// GET /api/home - Get all home page content
router.get('/', async (req, res) => {
  try {
    const hero = await HeroContent.findOne({ isDeleted: false });
    
    // Get dynamic marketing stats from database
    const marketingStats = await MarketingStat.find({ 
      isDeleted: false, 
      isActive: true 
    }).sort({ order: 1 });

    // Prioritize PGs with offers, then random PGs
    const pgsWithOffers = await PG.aggregate([
      { 
        $match: { 
          status: 'active', 
          softDelete: { $ne: true },
          originalPrice: { $exists: true, $ne: null },
          $expr: { $gt: ['$originalPrice', '$price'] }
        } 
      },
      {
        $project: {
          name: 1,
          city: 1,
          state: 1,
          price: 1,
          originalPrice: 1,
          images: { $slice: ['$images', 1] },
          rating: 1
        }
      }
    ]);

    // Get random PGs to fill remaining slots
    const remainingCount = Math.max(0, 4 - pgsWithOffers.length);
    const randomPGs = remainingCount > 0 ? await PG.aggregate([
      { 
        $match: { 
          status: 'active', 
          softDelete: { $ne: true },
          $or: [
            { originalPrice: { $exists: false } },
            { originalPrice: null },
            { $expr: { $lte: ['$originalPrice', '$price'] } }
          ]
        } 
      },
      { $sample: { size: remainingCount } },
      {
        $project: {
          name: 1,
          city: 1,
          state: 1,
          price: 1,
          originalPrice: 1,
          images: { $slice: ['$images', 1] },
          rating: 1
        }
      }
    ]) : [];

    // Combine offers PGs with random PGs
    const allPGs = [...pgsWithOffers, ...randomPGs];

    // Transform PG data to ensure frontend compatibility
    const transformedPGs = allPGs.map(pg => {
      return {
        ...pg,
        originalPrice: pg.originalPrice || null // Ensure field exists
      };
    });

    // Random Rooms (limited info for public) - Added for featured rooms
    const randomRooms = await Room.find({})
      .select('name title city state pricing.rent pricing.originalPrice media.images rating propertyType locality')
      .limit(10)
      .lean();
    
    // Transform rooms data to match frontend expectations
    const transformedRooms = randomRooms.map(room => {
      return {
        ...room,
        title: room.title || room.name || `${room.propertyType} in ${room.city}`, // Ensure title exists
        price: room.pricing?.rent, // Map pricing.rent to price for consistency
        type: room.propertyType,
        images: room.media?.images || [], // Map media.images to images for frontend
        pricing: {
          ...room.pricing
        }
      };
    });

    const testimonials = await Testimonial.find({ isDeleted: false }).limit(6);
    const cta = await CTAContent.findOne({ isDeleted: false });
    
    // Section Headers - Dynamic content for all section titles and subtitles
    const sectionHeaders = {
      stats: {
        title: "Our Achievements",
        subtitle: "Numbers that speak for our commitment to excellence"
      },
      pgs: {
        title: "PGs For You",
        subtitle: "Discover comfortable and affordable PG accommodations tailored just for you"
      },
      rooms: {
        title: "Rooms For You", 
        subtitle: "Find perfect rooms with all amenities for comfortable living"
      },
      testimonials: {
        title: "What Our Users Say",
        subtitle: "Real experiences from our satisfied customers who found their perfect PG and room"
      },
      features: {
        title: "Why Choose Our Platform",
        subtitle: "Experience the best in PG accommodations and room rentals with our comprehensive platform"
      }
    };
    
    // Features/Marketing content - get from database only
    let features = await FeatureContent.findOne({ 
      isActive: true, 
      isDeleted: false 
    }).sort({ createdAt: -1 });
    
    // Sort active items by order if features exist
    if (features && features.items) {
      features.items = features.items
        .filter(item => item.isActive)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    res.json({ 
      hero, 
      stats: marketingStats, 
      featuredPGs: transformedPGs, // Use transformed PG data instead of randomPGs
      featuredRooms: transformedRooms,
      testimonials, 
      cta,
      features,
      sectionHeaders,
      success: true,
      type: 'public'
    });
  } catch (err) {
    res.status(500).json({ error: 'Home content fetch failed', details: err.message });
  }
});

// GET /api/home/city-stats/:cityName - Get city-specific statistics
router.get('/city-stats/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    
    if (!cityName) {
      return res.status(400).json({ 
        success: false, 
        error: 'City name is required' 
      });
    }

    // Get city info
    const cityInfo = await City.findOne({ 
      name: new RegExp(cityName.trim(), 'i'),
      isActive: true 
    });

    // Get PG stats for this city
    const pgStats = await PG.aggregate([
      { 
        $match: { 
          city: new RegExp(cityName.trim(), 'i'), 
          status: 'active',
          softDelete: { $ne: true }
        } 
      },
      {
        $group: {
          _id: null,
          totalPGs: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgRating: { $avg: '$rating.overall' }
        }
      }
    ]);

    // Get Room stats for this city
    const roomStats = await Room.aggregate([
      { 
        $match: { 
          city: new RegExp(cityName.trim(), 'i'),
          'propertyStatus.listingStatus': 'Active'
        } 
      },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          avgRent: { $avg: '$pricing.rent' },
          minRent: { $min: '$pricing.rent' },
          maxRent: { $max: '$pricing.rent' },
          avgRating: { $avg: '$rating.overall' }
        }
      }
    ]);

    // Get popular amenities in this city
    const popularAmenities = await PG.aggregate([
      { 
        $match: { 
          city: new RegExp(cityName.trim(), 'i'), 
          status: 'active' 
        } 
      },
      { $unwind: '$amenities' },
      { 
        $group: { 
          _id: '$amenities', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      city: {
        name: cityName,
        info: cityInfo,
        stats: {
          pgs: pgStats[0] || { totalPGs: 0, avgPrice: 0, minPrice: 0, maxPrice: 0, avgRating: 0 },
          rooms: roomStats[0] || { totalRooms: 0, avgRent: 0, minRent: 0, maxRent: 0, avgRating: 0 },
          popularAmenities: popularAmenities || []
        }
      }
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch city stats', 
      details: err.message 
    });
  }
});

export default router;
