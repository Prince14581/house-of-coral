const eventBus = require('../../../shared/events/event.bus');
const AuditLog = require('../models/audit.log');

// Listen to EVERY event for archival
eventBus.on('*', async (eventName, data) => {
    await AuditLog.create({
        event: eventName,
        payload: data,
        timestamp: new Date()
    });
});
