const mongoose = require('mongoose');
const Relationship = require('../models/Relationship');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { validateObjectId, AppError } = require('../utils/helpers');

const ALLOWED_TYPES = ['friend', 'match', 'colleague'];
const VALID_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'blocked'],
  accepted: ['blocked'],
  rejected: ['pending', 'blocked'],
  blocked: ['unblocked'],
  unblocked: ['pending', 'accepted'],
  removed: [] // Terminal state
};

/**
 * Standardized Audit Helper
 */
const logActivity = (session, data) => AuditLog.create([{
  actorId: data.actorId,
  action: data.action,
  documentId: data.documentId,
  metadata: data.metadata || {}
}], { session });

const generateKey = (id1, id2) => [id1.toString(), id2.toString()].sort().join(':');

/**
 * Atomic Create with Unique Index Enforcement
 */
exports.createRelationship = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { targetUserId, type } = req.body;
    if (!validateObjectId(targetUserId)) throw new AppError('Invalid target', 400);
    if (!ALLOWED_TYPES.includes(type)) throw new AppError('Invalid type', 400);

    await session.withTransaction(async () => {
      const targetUser = await User.findById(targetUserId).session(session);
      if (!targetUser || targetUser.status !== 'active') throw new AppError('Target unavailable', 404);

      try {
        const [newRel] = await Relationship.create([{
          initiator: req.user.id,
          target: targetUserId,
          type,
          relationshipKey: generateKey(req.user.id, targetUserId),
          status: 'pending'
        }], { session });

        await logActivity(session, {
          actorId: req.user.id,
          action: 'RELATIONSHIP_REQUESTED',
          documentId: newRel._id
        });

        res.status(201).json({ status: 'success', data: newRel });
      } catch (err) {
        if (err.code === 11000) throw new AppError('Relationship already exists', 409);
        throw err;
      }
    });
  } catch (error) { next(error); } 
  finally { session.endSession(); }
};

/**
 * Transactional Status Update
 */
exports.updateStatus = async (req, res, next) => {
  const { relationshipId, status: newStatus } = req.body;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const rel = await Relationship.findById(relationshipId).session(session);
      if (!rel || rel.deletedAt) throw new AppError('Not found', 404);
      if (rel.target.toString() !== req.user.id && rel.initiator.toString() !== req.user.id) {
        throw new AppError('Unauthorized', 403);
      }
      if (!VALID_TRANSITIONS[rel.status]?.includes(newStatus)) {
        throw new AppError(`Invalid transition: ${rel.status} -> ${newStatus}`, 400);
      }

      const oldStatus = rel.status;
      rel.status = newStatus;
      await rel.save({ session });

      await logActivity(session, {
        actorId: req.user.id,
        action: 'RELATIONSHIP_UPDATED',
        documentId: relationshipId,
        metadata: { oldStatus, newStatus }
      });

      res.status(200).json({ status: 'success', data: rel });
    });
  } catch (error) { next(error); } 
  finally { session.endSession(); }
};

/**
 * Transactional Soft Delete
 */
exports.deleteRelationship = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const rel = await Relationship.findOneAndUpdate(
        { _id: req.params.id, $or: [{ initiator: req.user.id }, { target: req.user.id }], deletedAt: null },
        { $set: { status: 'removed', deletedAt: new Date() } },
        { new: true, session }
      );
      if (!rel) throw new AppError('Relationship not found', 404);

      await logActivity(session, {
        actorId: req.user.id,
        action: 'RELATIONSHIP_REMOVED',
        documentId: req.params.id
      });

      res.status(200).json({ status: 'success', message: 'Relationship removed' });
    });
  } catch (error) { next(error); } 
  finally { session.endSession(); }
};

/**
 * Paginated Fetch with Projection
 */
exports.getUserRelationships = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const query = { $or: [{ initiator: req.user.id }, { target: req.user.id }], deletedAt: null };

    const [data, total] = await Promise.all([
      Relationship.find(query)
        .select('initiator target status type createdAt')
        .populate('initiator target', 'username avatar')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Relationship.countDocuments(query)
    ]);

    res.status(200).json({ status: 'success', data, meta: { page, limit, total } });
  } catch (error) { next(error); }
};
