const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

// Encryption & Hashing Utilities
const ALGORITHM = 'aes-256-gcm';
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  return (key && Buffer.from(key, 'hex').length === 32) ? Buffer.from(key, 'hex') : null;
};

const encrypt = (text) => {
  const key = getEncryptionKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + cipher.getAuthTag().toString('hex');
};

const decrypt = (encryptedText) => {
  try {
    const key = getEncryptionKey();
    if (!key || !encryptedText) return null;
    const [ivHex, encryptedHex, tagHex] = encryptedText.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString();
  } catch { return null; }
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const transformUser = (doc, ret) => {
  delete ret.passwordHash; delete ret.tokenVersion; delete ret.__v;
  delete ret.twoFactor?.secret; delete ret.twoFactor?.backupCodes;
  delete ret.emailVerificationToken; delete ret.passwordResetToken;
  delete ret.emailVerificationExpires; delete ret.passwordResetExpires;
  if (ret.security) { delete ret.security.failedAttempts; delete ret.security.accountLockedUntil; }
  return ret;
};

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, lowercase: true, match: [/^[a-z0-9_]+$/, 'Invalid format'], minlength: 3, maxlength: 30 },
  email: { type: String, required: true, trim: true, lowercase: true, validate: [validator.isEmail, 'Invalid email'] },
  phone: { type: String, trim: true, sparse: true, validate: { validator: v => !v || /^\+[1-9]\d{1,14}$/.test(v), message: 'Use E.164' } },
  passwordHash: { type: String, required: true, select: false },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  
  profile: {
    displayName: { type: String, trim: true, maxlength: 50 },
    avatar: String,
    bio: { type: String, maxlength: 200 },
    country: { type: String, maxlength: 2 }
  },
  
  tokenVersion: { type: Number, default: 0, select: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  
  twoFactor: { 
    enabled: { type: Boolean, default: false }, 
    secret: { type: String, select: false }, 
    backupCodes: { type: [String], select: false } 
  },
  
  verification: {
    email: { type: Boolean, default: false }, emailVerifiedAt: Date,
    phone: { type: Boolean, default: false }, phoneVerifiedAt: Date,
    identity: { type: Boolean, default: false }, identityVerifiedAt: Date
  },
  
  security: {
    failedAttempts: { type: Number, default: 0, select: false },
    lastFailedAt: Date,
    accountLockedUntil: { type: Date, select: false },
    passwordChangedAt: Date,
    loginCount: { type: Number, default: 0 },
    lastLogin: { at: Date, ip: String, device: String }
  },

  role: { type: String, enum: ['admin', 'moderator', 'user'], default: 'user' },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  suspensionDetails: { reason: String, at: Date, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, liftedAt: Date, liftedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', immutable: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastSeenAt: Date,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true, strict: 'throw', optimisticConcurrency: true, toJSON: { virtuals: true, transform: transformUser }, toObject: { virtuals: true, transform: transformUser } });

// Indexes
UserSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
UserSchema.index({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
UserSchema.index({ walletId: 1 }, { unique: true, sparse: true });
UserSchema.index({ status: 1, isDeleted: 1 });
UserSchema.index({ role: 1, status: 1 });

// Statics & Methods
UserSchema.statics.findByEmail = function(email) { return this.findOne({ email: email.toLowerCase().trim() }); };
UserSchema.statics.findActiveByUsername = function(u) { return this.findOne({ username: u.toLowerCase().trim(), status: 'active' }); };

UserSchema.methods.comparePassword = async function(p) { return await bcrypt.compare(p, this.passwordHash); };
UserSchema.methods.setPassword = function(p) {
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(p)) throw new Error('Weak password');
  this.passwordHash = p; this.security.passwordChangedAt = new Date(); this.tokenVersion += 1;
};
UserSchema.methods.markLogin = function(ip, device) {
  this.security.loginCount += 1; this.security.failedAttempts = 0; this.security.accountLockedUntil = undefined;
  this.security.lastLogin = { at: new Date(), ip, device }; this.lastSeenAt = new Date();
};
UserSchema.methods.generateResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = hashToken(token);
  this.passwordResetExpires = new Date(Date.now() + 3600000);
  return token;
};
UserSchema.methods.clearResetToken = function() { this.passwordResetToken = undefined; this.passwordResetExpires = undefined; this.tokenVersion += 1; };
UserSchema.methods.generateEmailToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = hashToken(token);
  this.emailVerificationExpires = new Date(Date.now() + 86400000);
  return token;
};
UserSchema.methods.verifyEmail = function() { 
  this.verification.email = true; this.verification.emailVerifiedAt = new Date(); 
  this.emailVerificationToken = undefined; this.emailVerificationExpires = undefined; 
};
UserSchema.methods.recordFailedLogin = function() {
  this.security.failedAttempts += 1; this.security.lastFailedAt = new Date();
  if (this.security.failedAttempts >= 5) this.security.accountLockedUntil = new Date(Date.now() + 1800000);
};
UserSchema.methods.isLocked = function() { return !!(this.security.accountLockedUntil && this.security.accountLockedUntil > new Date()); };
UserSchema.methods.unlockAccount = function() { this.security.failedAttempts = 0; this.security.accountLockedUntil = undefined; };
UserSchema.methods.get2FASecret = function() { return decrypt(this.twoFactor.secret); };
UserSchema.methods.set2FASecret = function(s) { this.twoFactor.secret = encrypt(s); };
UserSchema.methods.setBackupCodes = async function(codes) { this.twoFactor.backupCodes = await Promise.all(codes.map(c => bcrypt.hash(c, 12))); };
UserSchema.methods.consumeBackupCode = async function(code) {
  for (let i = 0; i < this.twoFactor.backupCodes.length; i++) {
    if (await bcrypt.compare(code, this.twoFactor.backupCodes[i])) { this.twoFactor.backupCodes.splice(i, 1); return true; }
  }
  return false;
};
UserSchema.methods.suspend = function(r, adminId) { this.status = 'suspended'; this.suspensionDetails = { reason: r, at: new Date(), by: adminId }; };
UserSchema.methods.unsuspend = function(adminId) { 
  this.status = 'active'; 
  if (!this.suspensionDetails) this.suspensionDetails = {};
  this.suspensionDetails.liftedAt = new Date(); this.suspensionDetails.liftedBy = adminId; 
};
UserSchema.methods.softDelete = function() { this.isDeleted = true; this.deletedAt = new Date(); this.tokenVersion += 1; };
UserSchema.methods.restore = function() { this.isDeleted = false; this.deletedAt = null; this.tokenVersion += 1; };

// Middleware
UserSchema.pre('save', async function(next) {
  if (this.isModified('passwordHash')) {
    try { this.passwordHash = await bcrypt.hash(this.passwordHash, 12); } 
    catch (err) { return next(err); }
  }
  next();
});
UserSchema.pre(/^find/, function(next) { if (!this.getOptions().withDeleted) this.where({ isDeleted: { $ne: true } }); next(); });
UserSchema.query.withDeleted = function() { return this.setOptions({ withDeleted: true }); };

// Virtuals
UserSchema.virtual('isActive').get(function () { return (this.status === 'active' && !this.isDeleted && !this.isLocked()); });
UserSchema.virtual('publicProfile').get(function() { 
  return { username: this.username, displayName: this.profile?.displayName, avatar: this.profile?.avatar, country: this.profile?.country }; 
});

module.exports = mongoose.model('User', UserSchema);
