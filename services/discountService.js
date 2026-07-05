const Coupon = require('../models/Coupon');

class DiscountService {
  async applyCoupon(code, originalPrice) {
    const coupon = await Coupon.findOne({ code, isActive: true });

    if (!coupon || new Date() > coupon.expiryDate || coupon.usageCount >= coupon.maxUsage) {
      throw new Error('Invalid or expired coupon');
    }

    const discountAmount = (originalPrice * coupon.discountPercent) / 100;
    const finalPrice = originalPrice - discountAmount;

    return { finalPrice, discountAmount, couponId: coupon._id };
  }

  async incrementUsage(couponId) {
    await Coupon.findByIdAndUpdate(couponId, { $inc: { usageCount: 1 } });
  }
}
module.exports = new DiscountService();
