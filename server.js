require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Middleware
const { calculateTreasuryFee } = require('./middleware/treasury');
const { verifyUser } = require('./middleware/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Apply Treasury Fee Middleware globally to all POST requests
app.use((req, res, next) => {
    if (req.method === 'POST') {
        calculateTreasuryFee(req, res, next);
    } else {
        next();
    }
});

// --- Database Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 
    });
    console.log("Successfully connected to MongoDB Atlas");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1); 
  }
};
connectDB();

// --- Import Pillar Routes ---
const bazaarRoutes = require('./routes/bazaar');
const rhythmRoutes = require('./routes/rhythm');

// --- Route Registry ---
// Bazaar is now secured with verifyUser middleware
app.use('/api/bazaar', verifyUser, bazaarRoutes);
app.use('/api/rhythm', rhythmRoutes);

// --- Root Route ---
app.get('/', (req, res) => {
    res.send('House-of-Coral API is running.');
});

// --- Server Port ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`House-of-Coral Ecosystem running on port ${PORT}`));
