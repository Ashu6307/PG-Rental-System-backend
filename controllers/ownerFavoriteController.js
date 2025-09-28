import Favorite from '../models/Favorite.js';
import PG from '../models/PG.js';

// Get all favorites for owner
export const getOwnerFavorites = async (req, res) => {
  try {
    // Find all PGs owned by this owner
    const pgs = await PG.find({ owner: req.user._id }).select('_id');
    const pgIds = pgs.map(pg => pg._id);
    
    // Find favorites for these PGs
    const favorites = await Favorite.find({
      item_type: 'PG', 
      item_id: { $in: pgIds }
    });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark/unmark favorite
export const toggleFavorite = async (req, res) => {
  try {
    const { item_type, item_id } = req.body;
    const existing = await Favorite.findOne({ user_id: req.user._id, item_type, item_id });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.json({ message: 'Favorite removed' });
    } else {
      const fav = new Favorite({ user_id: req.user._id, item_type, item_id });
      await fav.save();
      return res.json({ message: 'Favorite added', fav });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
