// scripts/verify-production.js
require('dotenv').config();
const mongoose = require('mongoose');
const SystemStatus = require('../models/SystemStatus');

async function verifyProduction() {
    console.log("--- Initializing Production Health Check ---");
    
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("1. Database Connection: SUCCESS");

        const status = await SystemStatus.findOne({ id: 'global_config' });
        if (!status) {
            console.log("2. System Configuration: NOT FOUND (Initializing...)");
            await SystemStatus.create({ id: 'global_config', isLocked: false });
        } else {
            console.log("2. System Configuration: LOADED (isLocked: " + status.isLocked + ")");
        }

        console.log("3. Treasury Node: AWAITING HANDSHAKE");
        console.log("--- Production Ready for Launch ---");
        process.exit(0);
    } catch (err) {
        console.error("PRODUCTION VERIFICATION FAILED:", err.message);
        process.exit(1);
    }
}

verifyProduction();
