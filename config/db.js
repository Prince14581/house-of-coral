// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("Centralized Authority: Connected to Database successfully.");
    } catch (err) {
        console.error("Centralized Authority: Database connection FAILED.");
        process.exit(1); // Stop the server if the source of truth is unreachable
    }
};

module.exports = connectDB;
