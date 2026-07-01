// test-master.js
require('dotenv').config();
const mongoose = require('mongoose');
const { processBazaarTransaction } = require('./services/paymentService');
const { runIntegrityCheck } = require('./services/reconciliationService');
const { recoverPlatform } = require('./services/emergencyService');
const Ledger = require('./models/Ledger');
const SystemStatus = require('./models/SystemStatus');

async function runMasterTest() {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("--- Starting Master Integrity & Recovery Test ---");

        // 1. Reset Environment
        await Ledger.deleteMany({});
        await SystemStatus.updateOne({ id: 'global_config' }, { isLocked: false }, { upsert: true });

        // 2. Test Auto-Lock (Simulating Reconciliation Drift)
        console.log("[Phase 1] Simulating Audit Drift...");
        await processBazaarTransaction('USER_123', 100, 'ITEM_001');
        await Ledger.updateOne({ pillar: 'BAZAAR' }, { $inc: { fee: 50 } });
        await runIntegrityCheck();

        const statusLocked = await SystemStatus.findOne({ id: 'global_config' });
        if (!statusLocked.isLocked) throw new Error("Auto-lock failed.");
        console.log("SUCCESS: Drift detected and system is LOCKED.");

        // 3. Test Recovery (Simulating Administrator Intervention)
        console.log("[Phase 2] Attempting Recovery...");
        await recoverPlatform(process.env.ADMIN_TOKEN);

        const statusUnlocked = await SystemStatus.findOne({ id: 'global_config' });
        if (statusUnlocked.isLocked) throw new Error("Recovery failed.");
        console.log("SUCCESS: System successfully UNLOCKED via admin token.");

        console.log("--- MASTER TEST PASSED: Platform is production ready. ---");
        process.exit(0);
    } catch (err) {
        console.error("MASTER TEST FAILED:", err.message);
        process.exit(1);
    }
}

runMasterTest();
