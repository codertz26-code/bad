const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// WebP metadata tool path
const WEBP_META = path.join(__dirname, '../node_modules/webp-meta/bin/webp-meta');

// Add metadata to WebP sticker
const addMetadata = async (stickerPath, packname = 'BUD GUYS', author = 'BAD GUYS HACKERS') => {
    try {
        const exif = {
            'sticker-pack-id': 'com.badguys.sticker',
            'sticker-pack-name': packname,
            'sticker-pack-publisher': author,
            'sticker-pack-publisher-email': 'badguys@hackers.com',
            'sticker-pack-publisher-website': 'https://github.com/',
            'android-app-store-link': 'https://play.google.com/store/apps/details?id=com.badguys.sticker',
            'ios-app-store-link': 'https://apps.apple.com/app/id123456789'
        };

        // Create exif data
        const exifBuffer = Buffer.from(JSON.stringify(exif));
        const exifPath = stickerPath.replace('.webp', '.exif');
        await fs.writeFile(exifPath, exifBuffer);

        // Add exif to webp
        if (fs.existsSync(WEBP_META)) {
            await execPromise(`${WEBP_META} set "${stickerPath}" "${exifPath}"`);
        }

        // Cleanup
        await fs.remove(exifPath);
        
        return true;
    } catch (error) {
        console.log('Error adding metadata:', error);
        return false;
    }
};

// Read metadata from WebP
const readMetadata = async (stickerPath) => {
    try {
        if (!fs.existsSync(WEBP_META)) return null;

        const { stdout } = await execPromise(`${WEBP_META} get "${stickerPath}"`);
        return JSON.parse(stdout);
    } catch (error) {
        console.log('Error reading metadata:', error);
        return null;
    }
};

module.exports = {
    addMetadata,
    readMetadata
};