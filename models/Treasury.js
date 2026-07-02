// models/Treasury.js
const mongoose = require('mongoose');

const TreasurySchema = new mongoose.Schema({
    totalBalance: { type: Number, default: 0 }
});

TreasurySchema.statics.deposit = async function(amount) {
    // Atomically add to the private treasury
    return await this.findOneAndUpdate(
        {}, 
        { $inc: { totalBalance: amount } }, 
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model('Treasury', TreasurySchema);
