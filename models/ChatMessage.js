// models/ChatMessage.js
const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    username: { type: String, required: true },
    content: { type: String, required: true },
    room: { type: String, default: 'global' }, // Supports private or room-based chat
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
