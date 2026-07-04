// src/modules/Arena/antiCheat/IntegrityService.js
const crypto = require('crypto');

class IntegrityService {
    static verifyPacket(packet, signature, sessionSecret) {
        const hmac = crypto.createHmac('sha256', sessionSecret);
        hmac.update(JSON.stringify(packet));
        return hmac.digest('hex') === signature;
    }
}
