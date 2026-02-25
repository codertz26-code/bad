const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Download YouTube video
const downloadYouTubeVideo = async (url, quality = '360') => {
    try {
        const api = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(url)}`;
        const { data: apiRes } = await axios.get(api);
        
        if (!apiRes || !apiRes.data) {
            // Try fallback API
            const fallbackApi = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(url)}`;
            const fallbackRes = await axios.get(fallbackApi, { timeout: 30000 });
            return fallbackRes.data;
        }
        
        return apiRes;
    } catch (error) {
        console.log('Error downloading video:', error);
        throw error;
    }
};

// Download YouTube audio
const downloadYouTubeAudio = async (url) => {
    try {
        const fallbackApi = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(url)}`;
        const response = await axios.get(fallbackApi, { timeout: 30000 });
        return response.data;
    } catch (error) {
        console.log('Error downloading audio:', error);
        throw error;
    }
};

// Convert video to MP3
const videoToMp3 = async (inputPath, outputPath) => {
    try {
        await execPromise(`ffmpeg -i "${inputPath}" -q:a 0 -map a "${outputPath}" -y`);
        return outputPath;
    } catch (error) {
        console.log('Error converting to MP3:', error);
        throw error;
    }
};

// Compress video
const compressVideo = async (inputPath, outputPath, size = '720') => {
    try {
        await execPromise(`ffmpeg -i "${inputPath}" -vf "scale=${size}:-1" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k "${outputPath}" -y`);
        return outputPath;
    } catch (error) {
        console.log('Error compressing video:', error);
        throw error;
    }
};

// Get video duration
const getVideoDuration = async (videoPath) => {
    try {
        const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`);
        return parseFloat(stdout);
    } catch (error) {
        console.log('Error getting video duration:', error);
        return 0;
    }
};

module.exports = {
    downloadYouTubeVideo,
    downloadYouTubeAudio,
    videoToMp3,
    compressVideo,
    getVideoDuration
};