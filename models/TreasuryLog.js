const mongoose = require('mongoose');

const treasuryLogSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    grossAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true }, // The 10% calculated
    netAmount: { type: Number, required: true },
    pillarOrigin: { type: String, enum: ['Stage', 'RhythmHub', 'GlobalLink', 'HeartStrings', 'Bazaar', 'TerraHouse', 'Arena', 'Jubilee'], required: true },
    timestamp: { type: Date, default: Date.now },
    // Forensic "Seal": A hash of the transaction data to ensure integrity
    transactionSeal: { type: String, required: true } 
});

module.exports = mongoose.model('TreasuryLog', treasuryLogSchema);
