// config/shadow.js
const dotenv = require('dotenv');
const path = require('path');

const initShadow = () => {
    if (process.env.SHADOW_MODE === 'true') {
        dotenv.config({ path: path.resolve(__dirname, '../.env.shadow') });
        console.log("--- [SHADOW ENVIRONMENT ACTIVE] ---");
    }
};

module.exports = { initShadow };
