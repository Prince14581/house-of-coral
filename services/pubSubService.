// services/pubSubService.js
const Redis = require('ioredis');
const pub = new Redis(process.env.REDIS_URL);
const sub = new Redis(process.env.REDIS_URL);

exports.publishEvent = (channel, message) => {
    pub.publish(channel, JSON.stringify(message));
};

exports.subscribeToChannel = (channel, callback) => {
    sub.subscribe(channel);
    sub.on('message', (chan, msg) => {
        if (chan === channel) callback(JSON.parse(msg));
    });
};
