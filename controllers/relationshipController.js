const Relationship = require('../models/Relationship');

/**
 * Send a connection request between two users
 */
exports.sendConnectionRequest = async (req, res) => {
    try {
        const { userId, targetUserId, interests } = req.body;

        // Ensure user is not trying to connect with themselves
        if (userId === targetUserId) {
            return res.status(400).json({ message: "Cannot connect with yourself." });
        }

        const newConnection = new Relationship({ 
            userId, 
            targetUserId, 
            interests 
        });

        await newConnection.save();
        
        res.status(201).json({ 
            message: "Connection request sent successfully",
            connection: newConnection 
        });
    } catch (err) {
        // Handle duplicate request error specifically
        if (err.code === 11000) {
            return res.status(409).json({ message: "Request already exists." });
        }
        res.status(500).json({ error: err.message });
    }
};

/**
 * Retrieve all 'connected' relationships for a specific user
 */
exports.getConnections = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Find relationships where user is the initiator OR the target
        const connections = await Relationship.find({
            $or: [
                { userId: userId, status: 'connected' },
                { targetUserId: userId, status: 'connected' }
            ]
        });

        res.status(200).json(connections);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
