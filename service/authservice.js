// src/services/auth/AuthService.js
const jwt = require('jsonwebtoken');
const Identity = require('../identity/IdentityModel');

class AuthService {
    /**
     * Authenticates a user based on Mobile + OTP
     * @param {string} mobileNumber 
     * @param {string} otp 
     */
    static async authenticate(mobileNumber, otp) {
        // 1. Verify OTP (Integration with SMS provider goes here)
        // For now, assume verification is successful
        
        // 2. Find or Create User
        let user = await Identity.findOne({ mobileNumber });
        if (!user) {
            user = await Identity.create({ 
                mobileNumber, 
                userId: `user_${Date.now()}` 
            });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { userId: user.userId, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        return { user, token };
    }
}

module.exports = AuthService;
