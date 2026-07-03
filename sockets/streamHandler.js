const socketIo = require('socket.io');

const initSockets = (server) => {
    const io = socketIo(server);

    io.on('connection', (socket) => {
        console.log('User connected to live stream');

        // Logic for "Tipping" a performer
        socket.on('tip', async (data) => {
            const { amount, performerId, senderId } = data;
            
            // Integrate with your existing Treasury logic
            // This reuses the service we built earlier
            const { processTransaction } = require('../services/treasuryService');
            const result = await processTransaction(amount, senderId, performerId, 'Stage');
            
            if (result.success) {
                io.emit('tip-confirmed', { amount, performerId });
            }
        });
    });
};

module.exports = initSockets;
