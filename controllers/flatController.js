import Flat from '../models/Flat.js';
// Get public flats with filtering
export const getPublicFlats = async (req, res) => {
  try {
    const {
      city,
      type,
      minRent,
      maxRent,
      furnished,
      bedrooms,
      preferredTenants,
      petAllowed,
      smokingAllowed,
      amenities,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object
    const filter = {
      status: 'approved',
      available: true,
      softDelete: { $ne: true }
    };

    if (city) filter.city = new RegExp(city, 'i');
    if (type) filter.type = type;
    if (minRent || maxRent) {
      filter.rent = {};
      if (minRent) filter.rent.$gte = parseInt(minRent);
      if (maxRent) filter.rent.$lte = parseInt(maxRent);
    }
    if (furnished) filter.furnished = furnished;
    if (bedrooms) filter.bedrooms = parseInt(bedrooms);
    if (preferredTenants && preferredTenants !== 'Any') {
      filter.preferredTenants = { $in: [preferredTenants, 'Any'] };
    }
    if (petAllowed === 'true') filter.petAllowed = true;
    if (smokingAllowed === 'true') filter.smokingAllowed = true;
    if (amenities) {
      const amenityList = Array.isArray(amenities) ? amenities : [amenities];
      filter.amenities = { $in: amenityList };
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const flats = await Flat.find(filter)
      .populate('owner', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Flat.countDocuments(filter);

    res.json({
      success: true,
      data: flats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNextPage: skip + flats.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get flat details
export const getFlatDetails = async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id)
      .populate('owner', 'name email phone')
      .lean();

    if (!flat || flat.status !== 'approved' || flat.softDelete) {
      return res.status(404).json({ error: 'Flat not found' });
    }

    // Increment view count
    await Flat.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 }
    });

    res.json({ success: true, data: flat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get nearby flats
export const getNearbyFlats = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const flats = await Flat.find({
      status: 'approved',
      available: true,
      softDelete: { $ne: true },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .populate('owner', 'name email phone')
    .limit(20)
    .lean();

    res.json({ success: true, data: flats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search flats
export const searchFlats = async (req, res) => {
  try {
    const { q, city, type, page = 1, limit = 12 } = req.query;
    
    const filter = {
      status: 'approved',
      available: true,
      softDelete: { $ne: true }
    };

    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { address: new RegExp(q, 'i') }
      ];
    }

    if (city) filter.city = new RegExp(city, 'i');
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const flats = await Flat.find(filter)
      .populate('owner', 'name email phone')
      .sort({ featured: -1, priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Flat.countDocuments(filter);

    res.json({
      success: true,
      data: flats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get featured flats
export const getFeaturedFlats = async (req, res) => {
  try {
    const flats = await Flat.find({
      status: 'approved',
      available: true,
      featured: true,
      softDelete: { $ne: true }
    })
    .populate('owner', 'name email phone')
    .sort({ priority: -1, createdAt: -1 })
    .limit(8)
    .lean();

    res.json({ success: true, data: flats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get flat filters/options
export const getFlatFilters = async (req, res) => {
  try {
    const cities = await Flat.distinct('city', { 
      status: 'approved', 
      available: true,
      softDelete: { $ne: true }
    });
    
    const types = await Flat.distinct('type', { 
      status: 'approved', 
      available: true,
      softDelete: { $ne: true }
    });

    const amenities = await Flat.distinct('amenities', { 
      status: 'approved', 
      available: true,
      softDelete: { $ne: true }
    });

    // Get rent range
    const rentStats = await Flat.aggregate([
      { 
        $match: { 
          status: 'approved', 
          available: true,
          softDelete: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          minRent: { $min: '$rent' },
          maxRent: { $max: '$rent' },
          avgRent: { $avg: '$rent' }
        }
      }
    ]);

    res.json({
      success: true,
      filters: {
        cities: cities.sort(),
        types: types.sort(),
        amenities: amenities.flat().filter((item, index, arr) => arr.indexOf(item) === index).sort(),
        rentRange: rentStats[0] || { minRent: 0, maxRent: 100000, avgRent: 25000 },
        furnishedOptions: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
        preferredTenants: ['Family', 'Bachelor Male', 'Bachelor Female', 'Any']
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  getPublicFlats,
  getFlatDetails,
  getNearbyFlats,
  searchFlats,
  getFeaturedFlats,
  getFlatFilters
};
