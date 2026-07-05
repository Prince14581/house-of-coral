class PriceCalculator {
  static calculate(basePrice, variantAdjustment = 0, discountPercent = 0) {
    // 1. Apply Variant (e.g., Size upgrade)
    const priceWithVariants = basePrice + variantAdjustment;
    
    // 2. Apply Discount
    const discountAmount = (priceWithVariants * discountPercent) / 100;
    const finalPrice = priceWithVariants - discountAmount;
    
    // 3. Rounding for Financial Compliance (to 2 decimal places)
    return Math.round(finalPrice * 100) / 100;
  }
}
