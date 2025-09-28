import express from 'express';
import City from '../models/City.js';

const router = express.Router();

// Get all active cities
router.get('/', async (req, res) => {
  try {
    const cities = await City.find({ isActive: true })
      .sort({ order: 1, name: 1 });

    const formattedCities = cities.map(city => ({
      id: city._id,
      name: city.name,
      image: city.image,
      isNew: city.isNew
    }));

    res.json({
      success: true,
      cities: formattedCities,
      total: formattedCities.length
    });

  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get popular cities (top 10 by order)
router.get('/popular', async (req, res) => {
  try {
    const popularCities = await City.find({ isActive: true })
      .sort({ order: 1 })
      .limit(10);

    const formattedCities = popularCities.map(city => ({
      id: city._id,
      name: city.name,
      image: city.image,
      isNew: city.isNew
    }));

    res.json({
      success: true,
      cities: formattedCities,
      total: formattedCities.length
    });

  } catch (error) {
    console.error('Error fetching popular cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular cities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
