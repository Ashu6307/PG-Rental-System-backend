import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item_type: { type: String, enum: ['PG', 'Room', 'Flat'], required: true },
  item_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String },
  is_read: { type: Boolean, default: false }
});

export default mongoose.model('Favorite', FavoriteSchema);
