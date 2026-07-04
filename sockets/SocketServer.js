// sockets/SocketServer.js
const socketIo = require('socket.io');

let io;

module.exports = {
    init: (server) => {
        io = socketIo(server);
        
        io.on('connection', (socket) => {
            // Join a private room for the user upon authentication
            const { userId } = socket.handshake.query;
            if (userId) socket.join(`user_${userId}`);
        });

        return io;
    },
    get: () => io,
    to: (room) => io.to(room) // Helper for service access
};
