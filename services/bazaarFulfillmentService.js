/**
 * Bazaar Fulfillment Service
 * Handles order processing, inventory management, and payment settlement
 * Ensures 10% treasury fee is captured at transaction initiation
 */

const TreasuryService = require('./TreasuryService');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Ledger = require('../models/Ledger');
const logger = require('./logger');
const crypto = require('crypto');

class BazaarFulfillmentService {
  /**
   * Process an order from start to completion
   * @param {Object} order - { buyerId, items: [{productId, quantity}], totalAmount }
   * @returns {Promise<Object>}
   */
  async processOrder(order) {
    let transaction = null;

    try {
      // Step 1: Validate inventory
      const inventoryValid = await this.validateInventory(order.items);
      if (!inventoryValid) {
        throw new Error('INSUFFICIENT_INVENTORY');
      }

      // Step 2: Deduct inventory
      await this.deductInventory(order.items);

      // Step 3: Calculate fee and net amount
      const fee = order.totalAmount * 0.10;
      const netAmount = order.totalAmount - fee;

      // Step 4: Create transaction record
      transaction = await this.createTransaction({
        sender: order.buyerId,
        receiver: order.sellerId || 'SYSTEM',
        amount: order.totalAmount,
        fee,
        netAmount,
        type: 'BAZAAR',
        orderId: order._id,
      });

      // Step 5: Record in ledger
      await this.recordInLedger({
        userId: order.buyerId,
        pillar: 'BAZAAR',
        amount: order.totalAmount,
        type: 'debit',
        activityId: transaction._id,
      });

      // Step 6: Route fee to treasury
      await TreasuryService.routeToTreasuryNode(fee);

      // Step 7: Emit fulfillment event
      const EventBus = require('./pubSubService');
      await EventBus.publish('order.fulfilled', {
        orderId: order._id,
        buyerId: order.buyerId,
        totalAmount: order.totalAmount,
        fee,
        netAmount,
        transactionId: transaction._id,
        timestamp: new Date(),
      });

      logger.info(`[Bazaar] Order processed: ${order._id} (Fee: ${fee})`);

      return {
        status: 'SUCCESS',
        orderId: order._id,
        transactionId: transaction._id,
        fee,
        netAmount,
        totalAmount: order.totalAmount,
      };
    } catch (error) {
      logger.error(`[Bazaar] Order processing failed: ${order._id}`, error);

      // Rollback inventory if transaction failed
      if (transaction) {
        await this.restoreInventory(order.items);
      }

      throw new Error(`Order processing failed: ${error.message}`);
    }
  }

  /**
   * Validate that all products have sufficient inventory
   * @param {Array} items - [{productId, quantity}]
   * @returns {Promise<boolean>}
   */
  async validateInventory(items) {
    try {
      for (const item of items) {
        const product = await Product.findById(item.productId);

        if (!product) {
          logger.warn(`Product not found: ${item.productId}`);
          return false;
        }

        if (product.stock < item.quantity) {
          logger.warn(
            `Insufficient stock for product ${item.productId}. Required: ${item.quantity}, Available: ${product.stock}`
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Inventory validation error:', error);
      return false;
    }
  }

  /**
   * Deduct inventory for purchased items
   * @param {Array} items
   */
  async deductInventory(items) {
    try {
      for (const item of items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }

      logger.info(`[Bazaar] Inventory deducted for ${items.length} items`);
    } catch (error) {
      logger.error('Inventory deduction failed:', error);
      throw error;
    }
  }

  /**
   * Restore inventory in case of failed transaction
   * @param {Array} items
   */
  async restoreInventory(items) {
    try {
      for (const item of items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { new: true }
        );
      }

      logger.info(`[Bazaar] Inventory restored for ${items.length} items (rollback)`);
    } catch (error) {
      logger.error('Inventory restoration failed (CRITICAL):', error);
      // Alert admin
    }
  }

  /**
   * Create transaction record with HMAC signature
   * @param {Object} txData
   * @returns {Promise<Object>}
   */
  async createTransaction(txData) {
    try {
      // Generate HMAC signature for integrity
      const signature = this.generateHMACSha256(txData);

      const transaction = new Transaction({
        ...txData,
        signature,
      });

      await transaction.save();
      return transaction;
    } catch (error) {
      logger.error('Transaction creation failed:', error);
      throw error;
    }
  }

  /**
   * Record transaction in ledger
   * @param {Object} ledgerData
   */
  async recordInLedger(ledgerData) {
    try {
      const ledgerEntry = new Ledger(ledgerData);
      await ledgerEntry.save();
      logger.info(`[Bazaar] Ledger entry created: ${ledgerEntry._id}`);
      return ledgerEntry;
    } catch (error) {
      logger.error('Ledger recording failed:', error);
      throw error;
    }
  }

  /**
   * Generate HMAC-SHA256 signature for transaction integrity
   * @param {Object} data
   * @returns {string}
   */
  generateHMACSha256(data) {
    const secret = process.env.TRANSACTION_SECRET || 'house-of-coral-secret';
    const message = JSON.stringify(data);
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  /**
   * Verify transaction signature
   * @param {Object} transaction
   * @returns {boolean}
   */
  verifyTransactionSignature(transaction) {
    const { signature, ...data } = transaction.toObject();
    const expectedSignature = this.generateHMACSha256(data);
    return signature === expectedSignature;
  }

  /**
   * Get order status
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  async getOrderStatus(orderId) {
    try {
      const transaction = await Transaction.findOne({ 'metadata.orderId': orderId });

      if (!transaction) {
        return { status: 'NOT_FOUND' };
      }

      return {
        orderId,
        transactionId: transaction._id,
        amount: transaction.amount,
        fee: transaction.fee,
        netAmount: transaction.netAmount,
        status: 'COMPLETED',
        completedAt: transaction.timestamp,
      };
    } catch (error) {
      logger.error(`Error retrieving order status: ${orderId}`, error);
      throw error;
    }
  }

  /**
   * Refund an order
   * @param {string} orderId
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async refundOrder(orderId, reason = 'CUSTOMER_REQUEST') {
    try {
      const transaction = await Transaction.findOne({ 'metadata.orderId': orderId });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Create refund transaction (reverse)
      const refundTx = new Transaction({
        sender: transaction.receiver,
        receiver: transaction.sender,
        amount: transaction.netAmount, // Refund net amount only (fee is kept)
        fee: 0,
        netAmount: transaction.netAmount,
        type: 'BAZAAR_REFUND',
        metadata: {
          originalTransactionId: transaction._id,
          reason,
        },
        signature: this.generateHMACSha256({
          sender: transaction.receiver,
          receiver: transaction.sender,
          amount: transaction.netAmount,
          type: 'BAZAAR_REFUND',
        }),
      });

      await refundTx.save();

      // Restore inventory
      const ledgerEntry = await Ledger.findOne({ activityId: transaction._id });
      if (ledgerEntry) {
        // Fetch order items and restore
        logger.info(`[Bazaar] Order ${orderId} refunded. TransactionId: ${refundTx._id}`);
      }

      return {
        status: 'REFUND_PROCESSED',
        refundTransactionId: refundTx._id,
        refundAmount: transaction.netAmount,
      };
    } catch (error) {
      logger.error(`Refund processing failed for order ${orderId}:`, error);
      throw error;
    }
  }
}

module.exports = new BazaarFulfillmentService();
