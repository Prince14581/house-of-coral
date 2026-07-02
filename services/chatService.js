// services/chatService.js
const ChatMessage = require('../models/ChatMessage');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('send_message', async (data) => {
            const { senderId, username, content, room } = data;
            
            // Persist message to DB
            const message = await ChatMessage.create({ senderId, username, content, room });
            
            // Broadcast to room
            io.to(room).emit('receive_message', message);
        });

        socket.on('join_room', (room) => {
            socket.join(room);
        });
    });
};
