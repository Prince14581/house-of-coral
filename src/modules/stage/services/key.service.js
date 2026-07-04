const crypto = require('crypto');

class KeyService {
    static generateSecureKey(userId) {
        // Create a hash bound to the user's ID
        return crypto.createHmac('sha256', process.env.STREAM_SECRET)
                     .update(userId.toString() + Date.now())
                     .digest('hex');
    }
}
module.exports = KeyService;
