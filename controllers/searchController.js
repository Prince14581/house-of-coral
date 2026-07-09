const mongoose = require('mongoose');
const RhythmContent = require('../models/RhythmContent');
const User = require('../models/User');
const { AppError } = require('../utils/helpers');

// Platform Configuration
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MIN_QUERY_LENGTH = 2;
const SEARCH_TYPES = ['rhythm', 'users'];
const VALID_CONTENT_TYPES = ['music', 'comedy'];

// Reusable Query Filters for Consistency
const ACTIVE_USER_FILTER = { 
  status: 'active', isBanned: false, isSuspended: false, deletedAt: null 
};
const ACTIVE_CONTENT_FILTER = { deletedAt: null };

/**
 * Global Search: Final Enterprise-Grade Implementation
 */
exports.search = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { q, type } = req.query;
    
    // 1. Strict Validation
    if (type && !SEARCH_TYPES.includes(type)) throw new AppError('Invalid search type', 400);
    if (!q || typeof q !== 'string') throw new AppError('Query required', 400);
    
    const cleanQuery = q.trim().replace(/\s+/g, ' '); 
    if (cleanQuery.length < MIN_QUERY_LENGTH) {
      throw new AppError(`Query must be at least ${MIN_QUERY_LENGTH} characters`, 400);
    }

    // Strict Pagination Validation
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? DEFAULT_LIMIT);
    if (!Number.isInteger(page) || page < 1) throw new AppError('Invalid page', 400);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) throw new AppError('Invalid limit', 400);
    const skip = (page - 1) * limit;

    // 2. Parallel Execution
    const [rhythmData, userData, rhythmCounts, userCount] = await Promise.all([
      (!type || type === 'rhythm') 
        ? RhythmContent.find(
            { ...ACTIVE_CONTENT_FILTER, $text: { $search: cleanQuery } }, 
            { title: 1, contentType: 1, mediaUrl: 1, author: 1, score: { $meta: "textScore" } }
          )
            .sort({ score: { $meta: "textScore" }, createdAt: -1 })
            .skip(skip).limit(limit)
            .populate('author', 'username')
            .maxTimeMS(5000).lean()
        : [],
      (!type || type === 'users')
        ? User.find(
            { ...ACTIVE_USER_FILTER, $text: { $search: cleanQuery } }, 
            { username: 1, avatar: 1, bio: 1, score: { $meta: "textScore" } }
          )
            .sort({ score: { $meta: "textScore" }, createdAt: -1 })
            .skip(skip).limit(limit)
            .maxTimeMS(5000).lean()
        : [],
      (!type || type === 'rhythm') 
        ? RhythmContent.aggregate([
            { $match: { ...ACTIVE_CONTENT_FILTER, $text: { $search: cleanQuery } } },
            { $group: { _id: "$contentType", count: { $sum: 1 } } }
          ]) : [],
      (!type || type === 'users')
        ? User.countDocuments({ ...ACTIVE_USER_FILTER, $text: { $search: cleanQuery } }) : 0
    ]);

    // 3. Aggregation & Metadata
    const stats = { music: 0, comedy: 0, rhythmTotal: 0, users: userCount };
    rhythmCounts.forEach(c => {
      if (VALID_CONTENT_TYPES.includes(c._id)) {
        stats[c._id] = c.count;
        stats.rhythmTotal += c.count;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        music: rhythmData.filter(i => i.contentType === 'music'),
        comedy: rhythmData.filter(i => i.contentType === 'comedy'),
        users: userData
      },
      stats,
      meta: {
        requestId: req.id,
        page,
        limit,
        totalRhythm: stats.rhythmTotal,
        totalUsers: userCount,
        totalPages: {
          rhythm: type === 'users' ? null : Math.ceil(stats.rhythmTotal / limit),
          users: type === 'rhythm' ? null : Math.ceil(userCount / limit)
        },
        hasNext: {
          rhythm: type === 'users' ? null : page < Math.ceil(stats.rhythmTotal / limit),
          users: type === 'rhythm' ? null : page < Math.ceil(userCount / limit)
        },
        executionTimeMs: Date.now() - startTime,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) { next(error); }
};
