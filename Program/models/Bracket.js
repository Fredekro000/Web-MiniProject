const mongoose = require('mongoose');

// In Match.js - Change round type to Number
const matchSchema = new mongoose.Schema({
  round: Number, // Changed from String
  img1: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
  img2: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
  votesImg1: { type: Number, default: 0 },
  votesImg2: { type: Number, default: 0 },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', default: null }
});

module.exports = mongoose.model('Bracket', bracketSchema);
