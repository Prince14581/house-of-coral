// services/reconciliationEngine.js
const Reconciliation = require('../models/Reconciliation');

exports.reconcileVendorBatch = async (vendorId, internalRecords, externalRecords) => {
    // Map external records by ID for fast lookup (O(n) complexity)
    const externalMap = new Map(externalRecords.map(r => [r.txId, r]));

    for (const internal of internalRecords) {
        const external = externalMap.get(internal.txId);
        
        let status = 'MATCHED';
        if (!external) {
            status = 'MISSING_EXTERNAL';
        } else if (Math.abs(internal.amount - external.amount) > 0.01) { // Floating point tolerance
            status = 'DISCREPANCY';
        }

        await Reconciliation.updateOne(
            { internalTxId: internal.txId },
            { 
                vendorId,
                amountInternal: internal.amount,
                amountExternal: external ? external.amount : 0,
                status
            },
            { upsert: true }
        );
    }
};
