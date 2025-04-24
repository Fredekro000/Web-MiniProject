const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  round: Number, // Changed from String
  index: Number, // NEW FIELD - Critical for bracket logic
  img1: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
  img2: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', default: null }
});

module.exports = mongoose.model('Match', matchSchema);
