const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const AuditService = require('../core/services/auditService');
const Logger = require('../core/services/logger');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { AppError } = require('../utils/helpers');

const DUMMY_HASH = '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/zBkqquzaBjYv1x38H45h8pD.j2';

/**
 * Login: Atomic State Transition for Authentication Lifecycle
 */
exports.login = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        let accessToken, refreshToken, user;
        await session.withTransaction(async () => {
            const { email, password } = req.body;
            user = await User.findOne({ email: email.trim().toLowerCase(), status: 'active', isDeleted: false })
                .select('+passwordHash +tokenVersion').session(session);
            
            // 1. Timing-attack mitigation
            if (!user) {
                await bcrypt.compare(password, DUMMY_HASH);
                await AuditService.log(session, { action: 'LOGIN', status: 'failed', metadata: { email, ip: req.ip } });
                throw new AppError('Invalid credentials', 401);
            }

            if (user.isLocked()) throw new AppError('Account locked', 423);
            if (!(await user.comparePassword(password))) {
                user.recordFailedLogin(); await user.save({ session });
                await AuditService.log(session, { actorId: user._id, action: 'LOGIN', status: 'failed', metadata: { ip: req.ip } });
                throw new AppError('Invalid credentials', 401);
            }
            if (!user.verification.email) throw new AppError('Verify email first', 403);

            // 2. Token Generation
            accessToken = jwt.sign(
                { sub: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion },
                process.env.JWT_SECRET,
                { algorithm: 'HS256', jwtid: crypto.randomUUID(), expiresIn: '15m', issuer: 'House-of-Coral', audience: 'House-of-Coral' }
            );

            const jti = crypto.randomUUID();
            refreshToken = jwt.sign(
                { sub: user._id.toString(), tokenVersion: user.tokenVersion },
                process.env.JWT_REFRESH_SECRET,
                { jwtid: jti, expiresIn: '30d', issuer: 'House-of-Coral', audience: 'House-of-Coral' }
            );

            // 3. Persistent Session Creation
            await Session.create([{
                userId: user._id,
                jti,
                tokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
                userAgent: req.get('user-agent'),
                ip: req.ip,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }], { session });

            // 4. Lifecycle Reset
            user.resetFailedLoginAttempts();
            user.markLogin(req.ip, req.get('user-agent'));
            await user.save({ session });
            await AuditService.log(session, {
                actorId: user._id, action: 'LOGIN', status: 'success',
                metadata: { ip: req.ip, requestId: req.id, jti }
            });
        });

        // 5. Finalize response
        res.cookie('refreshToken', refreshToken, { 
            httpOnly: true, secure: process.env.NODE_ENV === 'production', 
            sameSite: 'Strict', path: '/api/auth/refresh', maxAge: 30 * 24 * 60 * 60 * 1000 
        });
        res.status(200).json({ status: 'success', accessToken, user: { id: user._id, username: user.username } });
    } catch (error) {
        Logger.error('Login failed', { error, ip: req.ip });
        next(error);
    } finally { session.endSession(); }
};
