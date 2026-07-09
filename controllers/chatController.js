const Chat = require('../models/Chat');
const Message = require('../models/Message');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Atomic chat creation with audit trail.
 */
exports.getOrCreateChat = async (req, res) => {
    try {
        const { participantId } = req.body;
        const userId = req.user.id;

        if (participantId === userId) return res.status(400).json({ status: "error", message: "Cannot chat with yourself." });
        if (!mongoose.Types.ObjectId.isValid(participantId)) return res.status(400).json({ status: "error", message: "Invalid user ID." });

        const recipientExists = await User.exists({ _id: participantId });
        if (!recipientExists) return res.status(404).json({ status: "error", message: "User not found." });

        const chatKey = [userId, participantId].sort().join(':');
        
        const chat = await Chat.findOneAndUpdate(
            { chatKey },
            { 
                $setOnInsert: { 
                    participants: [userId, participantId],
                    lastMessageAt: new Date(),
                    unreadCounts: { [userId]: 0, [participantId]: 0 }
                } 
            },
            { upsert: true, new: true, rawResult: true }
        );

        if (chat.lastErrorObject?.updatedExisting === false) {
            await AuditLog.create({ action: 'CHAT_CREATED', actorId: userId, documentId: chat.value._id });
        }

        res.status(200).json({ status: "success", data: chat.value });
    } catch (error) {
        console.error({ route: req.originalUrl, error: error.message });
        res.status(500).json({ status: "error", message: "Failed to access chat." });
    }
};

/**
 * Atomic messaging with consolidated update logic.
 */
exports.sendMessage = async (req, res) => {
    const { chatId, text } = req.body;
    if (!mongoose.Types.ObjectId.isValid(chatId)) return res.status(400).json({ status: "error", message: "Invalid chat ID." });
    if (!text?.trim() || text.length > 4000) return res.status(400).json({ status: "error", message: "Invalid message." });

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const senderId = req.user.id;
            const chat = await Chat.findOne({ _id: chatId, participants: { $in: [senderId] } }).session(session);
            
            if (!chat) {
                await AuditLog.create([{ action: 'UNAUTHORIZED_CHAT_ACCESS', actorId: senderId, metadata: { chatId } }], { session });
                throw new Error("UNAUTHORIZED");
            }

            const recipientId = chat.participants.find(p => p.toString() !== senderId.toString());

            const [message] = await Message.create([{ chatId, senderId, text: text.trim(), status: 'sent' }], { session });

            // Consolidated $set to ensure all metadata is updated correctly
            await Chat.updateOne(
                { _id: chatId },
                { 
                    $set: { 
                        lastMessageAt: new Date(), 
                        lastMessagePreview: text.substring(0, 50),
                        [`unreadCounts.${senderId}`]: 0 
                    },
                    $inc: { [`unreadCounts.${recipientId}`]: 1 }
                },
                { session }
            );

            await AuditLog.create([{
                action: 'MESSAGE_SENT',
                actorId: senderId,
                documentId: message._id,
                metadata: { chatId, ip: req.ip, userAgent: req.get('user-agent') }
            }], { session });

            res.status(201).json({ status: "success", data: message });
        });
    } catch (error) {
        if (error.message === "UNAUTHORIZED") return res.status(403).json({ status: "error", message: "Unauthorized." });
        console.error({ route: req.originalUrl, method: req.method, error: error.stack });
        res.status(500).json({ status: "error", message: "Failed to send message." });
    } finally {
        session.endSession();
    }
};

/**
 * Paginated messages with consistent metadata.
 */
exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

        if (!mongoose.Types.ObjectId.isValid(chatId)) return res.status(400).json({ status: "error", message: "Invalid chat ID." });

        const chat = await Chat.findOne({ _id: chatId, participants: { $in: [req.user.id] } });
        if (!chat) return res.status(403).json({ status: "error", message: "Unauthorized." });

        const [messages, total] = await Promise.all([
            Message.find({ chatId }).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit).lean(),
            Message.countDocuments({ chatId })
        ]);

        res.status(200).json({ 
            status: "success", 
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, 
            data: messages 
        });
    } catch (error) {
        console.error({ route: req.originalUrl, error: error.message });
        res.status(500).json({ status: "error", message: "Failed to retrieve messages." });
    }
};
