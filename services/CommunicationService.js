// services/CommunicationService.js
const Message = require('../models/Message');

class CommunicationService {
    static async sendMessage(senderId, receiverId, encryptedPayload) {
        return await Message.create({
            senderId,
            receiverId,
            ...encryptedPayload, // { content, iv, tag }
            timestamp: new Date()
        });
    }
}
