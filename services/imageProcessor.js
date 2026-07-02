// services/imageProcessor.js
const sharp = require('sharp');

exports.generateThumbnail = async (buffer) => {
    try {
        // Resize to 200x200 pixels, maintaining aspect ratio
        const thumbnail = await sharp(buffer)
            .resize(200, 200, {
                fit: 'cover',
                position: 'center'
            })
            .toFormat('jpeg')
            .jpeg({ quality: 80 })
            .toBuffer();

        return thumbnail;
    } catch (err) {
        throw new Error("Thumbnail Generation Failed: " + err.message);
    }
};
