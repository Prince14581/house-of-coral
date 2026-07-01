 require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import Middleware & Models
const { calculateTreasuryFee } = require('./middleware/treasury');
const { verifyUser } = require('./middleware/auth');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(express.json());
app.use(cors());

// Global Treasury Enforcement (POST requests only)
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
const chatRoutes = require('./routes/chat');

// --- Route Registry ---
app.use('/api/bazaar', verifyUser, bazaarRoutes);
app.use('/api/rhythm', rhythmRoutes);
app.use('/api/chat', verifyUser, chatRoutes);

// --- Socket.io Connection Logic (Global Link Pillar) ---
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('send_message', async (data) => {
        try {
            const { senderId, receiverId, text } = data;
            const newMessage = new Message({ senderId, receiverId, text });
            await newMessage.save();
            // Broadcast to receiver
            io.emit('receive_message', data);
        } catch (err) {
            console.error("Chat Error:", err.message);
        }
    });

    socket.on('disconnect', () => console.log('User disconnected'));
});

// --- Root Route ---
app.get('/', (req, res) => {
    res.send('House-of-Coral Ecosystem API is active.');
});

// --- Server Port ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`House-of-Coral Ecosystem running on port ${PORT}`));
