const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const Jimp = require('jimp');

// Convert image to sticker
const imageToSticker = async (inputPath, outputPath, packname = 'BUD GUYS', author = 'BAD GUYS HACKERS') => {
    try {
        // Resize image to 512x512
        const image = await Jimp.read(inputPath);
        await image.resize(512, 512).writeAsync(inputPath);

        // Convert to webp
        await execPromise(`ffmpeg -i "${inputPath}" -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2" -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512x512 "${outputPath}" -y`);

        // Add metadata if exif is available
        try {
            const { addMetadata } = require('./exif');
            await addMetadata(outputPath, packname, author);
        } catch (e) {
            console.log('No exif support');
        }

        return outputPath;
    } catch (error) {
        console.log('Error creating sticker:', error);
        throw error;
    }
};

// Convert video to sticker (GIF)
const videoToSticker = async (inputPath, outputPath, packname = 'BUD GUYS', author = 'BAD GUYS HACKERS') => {
    try {
        // Convert first 10 seconds to webp
        await execPromise(`ffmpeg -i "${inputPath}" -t 10 -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=10,pad=512:512:(ow-iw)/2:(oh-ih)/2" -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512x512 "${outputPath}" -y`);

        // Add metadata if exif is available
        try {
            const { addMetadata } = require('./exif');
            await addMetadata(outputPath, packname, author);
        } catch (e) {
            console.log('No exif support');
        }

        return outputPath;
    } catch (error) {
        console.log('Error creating video sticker:', error);
        throw error;
    }
};

// Image to sticker (using Jimp)
const createStickerFromBuffer = async (buffer, packname = 'BUD GUYS', author = 'BAD GUYS HACKERS') => {
    try {
        const image = await Jimp.read(buffer);
        await image.resize(512, 512).getBufferAsync(Jimp.MIME_PNG);
        
        // This is simplified - in production you'd need to convert to webp
        return buffer;
    } catch (error) {
        console.log('Error creating sticker from buffer:', error);
        throw error;
    }
};

module.exports = {
    imageToSticker,
    videoToSticker,
    createStickerFromBuffer
};