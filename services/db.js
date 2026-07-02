// services/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URI, {
            // These options are standard for Node.js drivers 
            // ensuring the driver maintains a healthy connection pool
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("MongoDB Connected: Replica Set Topology Discovered.");
    } catch (err) {
        console.error("Database Connection Failed:", err.message);
        process.exit(1); 
    }
};

module.exports = connectDB;
