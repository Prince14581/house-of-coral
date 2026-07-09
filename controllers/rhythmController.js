const mongoose = require('mongoose');
const RhythmContent = require('../models/RhythmContent');
const AuditService = require('../core/services/auditService');
const { validateObjectId, AppError } = require('../utils/helpers');
const validator = require('validator');

// Platform Configuration Constants
const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 2000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CONTENT_TYPES = ['music', 'comedy'];

/**
 * Create Content: Enterprise-grade with normalized types and strict sanitization
 */
exports.createContent = async (req, res, next) => {
  const startTime = Date.now();
  const session = await mongoose.startSession();
  let newContent;

  try {
    const { title, description, contentType, mediaUrl } = req.body;

    // 1. Title Validation: Trim, check, and escape
    if (typeof title !== 'string') throw new AppError('Invalid title format', 400);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new AppError('Valid title required', 400);
    const cleanTitle = validator.escape(trimmedTitle);
    if (cleanTitle.length > MAX_TITLE_LENGTH) throw new AppError('Title too long', 400);
    
    // 2. URL and ContentType Validation
    if (typeof mediaUrl !== 'string' || !validator.isURL(mediaUrl, { protocols: ['http', 'https'], require_protocol: true })) {
      throw new AppError('Invalid media URL', 400);
    }
    const normalizedType = typeof contentType === 'string' ? contentType.toLowerCase() : '';
    if (!CONTENT_TYPES.includes(normalizedType)) throw new AppError('Invalid content type', 400);
    
    if (description && description.length > MAX_DESC_LENGTH) throw new AppError('Description too long', 400);
    const cleanDesc = description ? validator.escape(description.trim()) : '';

    await session.withTransaction(async () => {
      [newContent] = await RhythmContent.create([{
        author: req.user.id,
        title: cleanTitle,
        description: cleanDesc,
        contentType: normalizedType,
        mediaUrl
      }], { session });

      await AuditService.log(session, {
        actorId: req.user.id,
        action: 'RHYTHM_CONTENT_CREATED',
        documentId: newContent._id,
        metadata: { contentType: normalizedType, ip: req.ip, ua: req.get('user-agent') }
      });
    });

    res.status(201).json({
      status: 'success',
      data: newContent,
      meta: { requestId: req.id, executionTimeMs: Date.now() - startTime, reportDate: new Date().toISOString() }
    });
  } catch (error) { next(error); }
  finally { session.endSession(); }
};

/**
 * Get Content Feed: Type-safe, indexed, and optimized projection
 */
exports.getContentFeed = async (req, res, next) => {
  const startTime = Date.now();
  try {
    let { contentType } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    const query = { deletedAt: null };
    
    // Normalize and validate query param
    if (contentType) {
      contentType = contentType.toLowerCase();
      if (!CONTENT_TYPES.includes(contentType)) throw new AppError('Invalid content type requested', 400);
      query.contentType = contentType;
    }

    const [data, total] = await Promise.all([
      RhythmContent.find(query)
        .select('title description contentType mediaUrl author createdAt likesCount viewsCount')
        .sort({ createdAt: -1 })
        // Hint implies existence of index: { contentType: 1, createdAt: -1 } or { createdAt: -1 }
        .hint(contentType ? { contentType: 1, createdAt: -1 } : { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'username')
        .maxTimeMS(5000)
        .lean(),
      RhythmContent.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      data,
      meta: {
        requestId: req.id,
        page,
        limit,
        total,
        executionTimeMs: Date.now() - startTime,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) { next(error); }
};
