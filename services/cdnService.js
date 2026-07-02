// services/cdnService.js
const CDN_BASE_URL = process.env.CDN_DOMAIN; // e.g., 'https://cdn.houseofcoral.com'

exports.getAssetUrl = (assetKey) => {
    // Simply prepend the CDN domain to the asset key
    return `${CDN_BASE_URL}/${assetKey}`;
};
