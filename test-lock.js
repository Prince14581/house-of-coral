// test-lock.js
require('dotenv').config();
const mongoose = require('mongoose');
const { emergencyHaltPlatform, recoverPlatform } = require('./services/emergencyService');
const SystemStatus = require('./models/SystemStatus');

async function runArenaLockTest() {
    try {
        // 1. Connect to Shadow Database
        await mongoose.connect(process.env.DB_URI);
        console.log("--- Starting Arena Circuit Breaker Test ---");

        // 2. Step 1: Trigger Emergency Halt
        console.log("Triggering Emergency Halt...");
        await emergencyHaltPlatform("Automated Stress Test: Arena Pillar");

        // 3. Verify Lock Status
        const status = await SystemStatus.findOne({ id: 'global_config' });
        if (status.isLocked) {
            console.log("SUCCESS: Platform is LOCKED.");
        } else {
            console.error("FAILURE: Platform is still UNLOCKED.");
        }

        // 4. Step 2: Attempt Recovery
        console.log("Attempting Recovery...");
        // Ensure you pass your admin token here
        await recoverPlatform(process.env.ADMIN_TOKEN);

        // 5. Verify Unlocked Status
        const statusAfter = await SystemStatus.findOne({ id: 'global_config' });
        if (!statusAfter.isLocked) {
            console.log("SUCCESS: Platform is UNLOCKED.");
        } else {
            console.error("FAILURE: Platform is still LOCKED.");
        }

        console.log("--- Arena Circuit Breaker Test Complete ---");
        process.exit(0);
    } catch (err) {
        console.error("Test Error:", err.message);
        process.exit(1);
    }
}

runArenaLockTest();
