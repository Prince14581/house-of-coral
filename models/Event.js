const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    organizerId: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    pricePerTicket: { type: Number, required: true },
    totalTickets: { type: Number, required: true },
    ticketsSold: { type: Number, default: 0 },
    status: { type: String, enum: ['upcoming', 'ongoing', 'ended'], default: 'upcoming' }
});

module.exports = mongoose.model('Event', EventSchema);
