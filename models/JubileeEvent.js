// models/JubileeEvent.js
const mongoose = require('mongoose');

const JubileeEventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    capacity: { type: Number, required: true },
    ticketsSold: { type: Number, default: 0 },
    status: { type: String, enum: ['UPCOMING', 'LIVE', 'CLOSED'], default: 'UPCOMING' }
});

module.exports = mongoose.model('JubileeEvent', JubileeEventSchema);
