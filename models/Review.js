import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item_type: { type: String, enum: ['PG', 'Room', 'Flat'], required: true },
  item_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Review', ReviewSchema);
