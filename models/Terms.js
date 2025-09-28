const mongoose = require('mongoose');

const termsSchema = new mongoose.Schema({
  type: { type: String, enum: ['pg_booking', 'room_booking', 'flat_booking', 'add_pg', 'add_room', 'add_flat'], required: true },
  content: { type: String, required: true },
  version: { type: Number, default: 1 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Terms', termsSchema);
