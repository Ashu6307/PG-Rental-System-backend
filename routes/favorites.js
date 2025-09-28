import express from 'express';
import Favorite from '../models/Favorite.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticateJWT);

// Add to favorites
router.post('/add', async (req, res) => {
  try {
    const { item_type, item_id } = req.body;
    const user_id = req.user.id;
    
    // Check if already in favorites
    const existingFavorite = await Favorite.findOne({
      user_id,
      item_type,
      item_id
    });
    
    if (existingFavorite) {
      return res.status(400).json({ 
        success: false, 
        error: 'Property already in favorites' 
      });
    }
    
    // Create new favorite
    const favorite = new Favorite({
      user_id,
      item_type,
      item_id
    });
    
    await favorite.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Added to favorites',
      favorite 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove from favorites
router.delete('/remove', async (req, res) => {
  try {
    const { item_type, item_id } = req.body;
    const user_id = req.user.id;
    
    const deletedFavorite = await Favorite.findOneAndDelete({
      user_id,
      item_type,
      item_id
    });
    
    if (!deletedFavorite) {
      return res.status(404).json({ 
        success: false, 
        error: 'Favorite not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Removed from favorites' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if property is in favorites
router.get('/check/:item_type/:item_id', async (req, res) => {
  try {
    const { item_type, item_id } = req.params;
    const user_id = req.user.id;
    
    const favorite = await Favorite.findOne({
      user_id,
      item_type,
      item_id
    });
    
    res.json({ 
      success: true, 
      isFavorite: !!favorite 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user favorites (basic list)
router.get('/', async (req, res) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const favorites = await Favorite.find({ user_id })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalCount = await Favorite.countDocuments({ user_id });
    
    res.json({
      success: true,
      favorites,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Advanced favorites search/filter endpoint
router.post('/search', async (req, res) => {
  const { filters, sort, page, limit } = req.body;
  try {
    const user_id = req.user.id;
    
    // Add user filter
    const matchFilters = { user_id, ...filters };
    
    const favorites = await Favorite.aggregate([
      { $match: matchFilters },
      { $sort: sort || { _id: -1 } },
      { $skip: ((page || 1) - 1) * (limit || 20) },
      { $limit: limit || 20 },
    ]);
    
    res.status(200).json({ success: true, favorites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;