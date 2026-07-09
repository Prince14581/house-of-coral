const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Identification & Routing
  messageId: { type: String, required: true, unique: true, index: true, minlength: 16, maxlength: 128 },
  channelId: { type: String, required: true, index: true, minlength: 16, maxlength: 64 },
  senderId: { type: String, required: true, index: true, minlength: 16, maxlength: 64 },
  recipientId: { type: String, index: true, minlength: 16, maxlength: 64 },
  deviceId: { type: String, required: true, minlength: 16, maxlength: 64 },
  sequence: { type: Number, required: true, min: 0 },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },

  // Payload: Authenticated Encryption (AES-GCM 256)
  ciphertext: { type: String, required: true, minlength: 16, maxlength: 1048576 },
  iv: { type: String, required: true, match: /^[a-fA-F0-9]{24}$/ },
  authTag: { type: String, required: true, match: /^[a-fA-F0-9]{32}$/ },
  hash: { type: String, required: true, match: /^[a-fA-F0-9]{64}$/ },
  algorithm: { type: String, enum: ['AES-256-GCM'], default: 'AES-256-GCM' },
  keyVersion: { type: Number, default: 1, min: 1 },
  signature: { type: String, match: /^[a-fA-F0-9]{128}$/ },
  publicKeyId: { type: String, minlength: 16, maxlength: 128 },

  // Lifecycle, Tracking & Audit
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio', 'file', 'location', 'system'], 
    default: 'text' 
  },
  status: { 
    type: String, 
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'], 
    default: 'sending' 
  },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  readBy: { 
    type: [{ userId: { type: String, required: true }, readAt: { type: Date, default: Date.now } }], 
    default: [] 
  },
  
  edited: { type: Boolean, default: false },
  editedAt: Date,
  deleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: String,
  expiresAt: { type: Date },

  // Audit Fields
  createdBy: { type: String, default: function () { return this.senderId; } },
  lastModifiedBy: { type: String },

  // Features
  attachments: { 
    type: [{
      url: { type: String, required: true, match: /^https?:\/\/.+/ },
      mimeType: { type: String, required: true, enum: ['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg', 'application/pdf'] },
      size: { type: Number, required: true, min: 0 },
      filename: { type: String, required: true },
      checksum: { type: String, required: true, match: /^[a-fA-F0-9]{64}$/ },
      storageProvider: { type: String, required: true, enum: ['s3', 'gcs', 'azure', 'cloudinary', 'local'] },
      encrypted: { type: Boolean, default: true }
    }], 
    default: [],
    validate: { validator: v => v.length <= 10, message: 'Too many attachments' } 
  },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  pinned: { type: Boolean, default: false },
  
  reactions: { 
    type: [{
      userId: { type: String, required: true },
      type: { type: String, enum: ['👍', '❤️', '😂', '🔥', '😢', '👏'], required: true },
      reactedAt: { type: Date, default: Date.now }
    }], 
    default: [] 
  }
}, { 
  timestamps: true,
  optimisticConcurrency: true,
  strict: 'throw',
  toJSON: { 
    virtuals: true, 
    versionKey: false, 
    transform: (doc, ret) => { delete ret._id; delete ret.iv; delete ret.authTag; delete ret.hash; } 
  },
  toObject: { 
    virtuals: true, 
    versionKey: false, 
    transform: (doc, ret) => { delete ret._id; delete ret.iv; delete ret.authTag; delete ret.hash; } 
  }
});

// High-Performance Indexes
messageSchema.index({ messageId: 1 }, { unique: true });
messageSchema.index({ channelId: 1, sequence: 1 }, { unique: true });
messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1 });
messageSchema.index({ senderId: 1, status: 1 });
messageSchema.index({ recipientId: 1, createdAt: -1 });
messageSchema.index({ threadId: 1, createdAt: 1 });
messageSchema.index({ status: 1, createdAt: -1 });
messageSchema.index({ pinned: 1, channelId: 1 }, { partialFilterExpression: { pinned: true } });
messageSchema.index({ deleted: 1, createdAt: -1 }, { partialFilterExpression: { deleted: true } });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtuals
messageSchema.virtual('hasAttachments').get(function () { return this.attachments.length > 0; });
messageSchema.virtual('reactionCount').get(function () { return this.reactions.length; });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
