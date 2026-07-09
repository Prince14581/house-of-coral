const mongoose = require('mongoose');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const AuditService = require('../core/services/auditService');
const { validateObjectId, AppError } = require('../utils/helpers');
const validator = require('validator');

// Platform Configuration
const MAX_SKU_LENGTH = 50;

/**
 * Create Variant: Atomic with uniqueness and object validation
 */
exports.createVariant = async (req, res, next) => {
  const startTime = Date.now();
  const { productId } = req.params;
  const session = await mongoose.startSession();
  let newVariant;

  try {
    if (!validateObjectId(productId)) throw new AppError('Invalid product ID', 400);
    const { sku, price, stock, attributes } = req.body;

    // 1. Strict Validation
    if (!sku || typeof sku !== 'string' || sku.length > MAX_SKU_LENGTH) throw new AppError('Valid SKU required', 400);
    const cleanSku = validator.escape(sku.trim().toUpperCase());
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) throw new AppError('Valid price required', 400);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) throw new AppError('Valid stock required', 400);
    if (attributes !== undefined && (typeof attributes !== 'object' || Array.isArray(attributes))) {
      throw new AppError('Attributes must be an object', 400);
    }

    await session.withTransaction(async () => {
      const product = await Product.findOne({ _id: productId, owner: req.user.id }).session(session);
      if (!product) throw new AppError('Product not found or access denied', 404);

      // Enforce unique SKU per product
      const exists = await Variant.exists({ product: productId, sku: cleanSku }).session(session);
      if (exists) throw new AppError('SKU already exists for this product', 409);

      [newVariant] = await Variant.create([{
        product: productId,
        sku: cleanSku,
        price: parsedPrice,
        stock: parsedStock,
        attributes: attributes || {}
      }], { session });

      await AuditService.log(session, {
        actorId: req.user.id,
        action: 'PRODUCT_VARIANT_CREATED',
        documentId: newVariant._id,
        metadata: { productId, sku: cleanSku, price: parsedPrice, ip: req.ip }
      });
    });

    res.status(201).json({
      status: 'success',
      data: newVariant,
      meta: { requestId: req.id, executionTimeMs: Date.now() - startTime, generatedAt: new Date().toISOString() }
    });
  } catch (error) { next(error); }
  finally { session.endSession(); }
};

/**
 * Update Stock: Atomic adjustment with ownership verification
 */
exports.updateStock = async (req, res, next) => {
  const { variantId } = req.params;
  const { adjustment } = req.body;
  const session = await mongoose.startSession();
  let updatedVariant;

  try {
    if (!validateObjectId(variantId)) throw new AppError('Invalid variant ID', 400);
    if (!Number.isInteger(adjustment)) throw new AppError('Valid adjustment required', 400);

    await session.withTransaction(async () => {
      const variant = await Variant.findById(variantId).session(session);
      if (!variant) throw new AppError('Variant not found', 404);

      const product = await Product.findOne({ _id: variant.product, owner: req.user.id }).session(session);
      if (!product) throw new AppError('Access denied', 403);

      updatedVariant = await Variant.findOneAndUpdate(
        { _id: variantId, stock: { $gte: -adjustment } },
        { $inc: { stock: adjustment } },
        { session, new: true }
      );

      if (!updatedVariant) throw new AppError('Insufficient stock', 400);

      await AuditService.log(session, {
        actorId: req.user.id,
        action: 'VARIANT_STOCK_ADJUSTED',
        documentId: variantId,
        metadata: { adjustment, newStock: updatedVariant.stock, ip: req.ip }
      });
    });

    res.status(200).json({ status: 'success', data: { variantId, stock: updatedVariant.stock } });
  } catch (error) { next(error); }
  finally { session.endSession(); }
};
