require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Image = require('./models/Image');
const Match = require('./models/Match');

const app = express();
const PORT = process.env.PORT || 3000;


// Auto-reset DB in dev
const clearDatabase = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔥 Dev mode: Resetting database...');
    await Image.deleteMany({});
    await Match.deleteMany({});
    console.log('✅ Database cleared.');
  }
};

// After Mongo connects
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('🗃️ MongoDB connected');
  await clearDatabase();
});

// Middleware
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Image upload route
app.post('/upload', upload.array('images', 8), async (req, res) => {
  try {
    const savedImages = await Promise.all(req.files.map(file => {
      return new Image({
        filename: file.filename,
        path: `/uploads/${file.filename}`
      }).save();
    }));
    res.json({ uploaded: savedImages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Generate matches (run once after upload)
app.post('/generate-matches', async (req, res) => {
  try {
    const images = await Image.find();
    const total = images.length;

    if ((total & (total - 1)) !== 0) {
      return res.status(400).json({ error: 'Image count must be a power of 2 (e.g., 8, 16).' });
    }

    await Match.deleteMany({});

    const totalRounds = Math.log2(total);
    let matchId = 1;
    let index = 0;

    const allMatches = [];

    // First round participants
    let currentRoundParticipants = images.map((img, i) => ({ img, index: i }));

    for (let round = 1; round <= totalRounds; round++) {
      const matchesThisRound = [];

      for (let i = 0; i < currentRoundParticipants.length; i += 2) {
        const p1 = currentRoundParticipants[i];
        const p2 = currentRoundParticipants[i + 1];

        matchesThisRound.push({
          id: matchId++,
          round,
          index: i / 2,
          img1: p1?.img?._id || null,
          img2: p2?.img?._id || null,
          winner: null
        });
      }

      allMatches.push(...matchesThisRound);

      // Prepare next round: empty slots initially
      currentRoundParticipants = matchesThisRound.map((_, i) => ({
        img: null,
        index: i
      }));
    }

    await Match.insertMany(allMatches);
    const populated = await Match.find().populate('img1').populate('img2');
    res.json(populated);

  } catch (err) {
    console.error('Error generating matches:', err);
    res.status(500).json({ error: 'Failed to generate bracket' });
  }
});


// Voting endpoint
app.post('/vote/:matchId', async (req, res) => {
  const { winner } = req.body;
  const { matchId } = req.params;

  if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
    return res.status(400).json({ error: 'Invalid match ID.' });
  }

  if (!winner || !mongoose.Types.ObjectId.isValid(winner)) {
    return res.status(400).json({ error: 'Invalid winner ID.' });
  }

  try {
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found.' });

    // New validation: Check both competitors exist
    if (!match.img1 || !match.img2) {
      return res.status(400).json({ 
        error: 'Both competitors must be determined before voting' 
      });}

    if (match.winner) {
      return res.status(400).json({ error: 'Match already completed.' });
    }

    match.winner = winner;
    await match.save();

    // Repopulate just this match to ensure winner info is correct
    await match.populate(['img1', 'img2']); 

    // Find next-round match to advance winner
    const nextRound = match.round + 1;
    const nextIndex = Math.floor(match.index / 2);

    const nextMatch = await Match.findOne({ round: nextRound, index: nextIndex });

    if (nextMatch) {
      // Determine position in next match
      const isEvenIndex = match.index % 2 === 0;
      
      if (isEvenIndex) {
        nextMatch.img1 = winner;
      } else {
        nextMatch.img2 = winner;
      }
      
      await nextMatch.save();
      await nextMatch.populate(['img1', 'img2']); // For UI updates
    }

    // Check for final winner
    const maxRound = await Match.find().sort({ round: -1 }).limit(1);
    const finalRound = maxRound[0].round;
    const finalMatch = await Match.findOne({ round: finalRound, index: 0 });

    if (finalMatch && finalMatch.winner) {
      const champImage = await Image.findById(finalMatch.winner);
      return res.json({
        message: 'Final winner decided',
        champion: champImage
      });
    }

    res.json({ message: 'Vote registered' });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Failed to register vote' });
  }
});


// Get all matches with full image data
app.get('/matches', async (req, res) => {
  const matches = await Match.find().populate('img1').populate('img2');
  res.json(matches);
});


// Reset database route
app.post('/reset-db', async (req, res) => {
  await Match.deleteMany({});
  await Image.deleteMany({});
  res.send('Tournament reset.');
});



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
