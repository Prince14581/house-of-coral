// simulate-production.js
require('dotenv').config();
const mongoose = require('mongoose');
const { processSecureTransaction } = require('./services/transactionDispatcher');
const { runIntegrityCheck } = require('./services/reconciliationService');
const SystemStatus = require('./models/SystemStatus');

async function runProductionSimulation() {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("--- Starting Production Integrity Simulation ---");

        // 1. Simulate a Transaction
        console.log("Step 1: Processing Arena transaction...");
        await processSecureTransaction('TEST_USER_ID', 500, 'ARENA');
        console.log("Transaction successfully recorded.");

        // 2. Simulate a "Drift" (Injecting data corruption to test the Halt)
        console.log("Step 2: Simulating malicious ledger drift...");
        await Ledger.updateOne({ pillar: 'ARENA' }, { $inc: { fee: 50 } }); 

        // 3. Trigger Reconciliation
        console.log("Step 3: Running integrity check...");
        const result = await runIntegrityCheck();

        // 4. Verify System Halt
        const status = await SystemStatus.findOne({ id: 'global_config' });
        if (status.isLocked) {
            console.log("SUCCESS: System halted automatically due to drift.");
        } else {
            console.error("FAILURE: System failed to halt.");
        }

        console.log("--- Simulation Complete ---");
        process.exit(0);
    } catch (err) {
        console.error("Simulation Error:", err);
        process.exit(1);
    }
}

runProductionSimulation();
