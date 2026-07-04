const io = require('socket.io')(server);

io.on('connection', (socket) => {
    // Presence: Update user status in Identity pillar
    socket.on('set_presence', async (status) => {
        await Identity.updateOne({ userId: socket.userId }, { status });
    });

    // Real-time Notifications (Cross-Pillar)
    socket.on('join_channel', (channelId) => {
        socket.join(channelId);
    });
});
