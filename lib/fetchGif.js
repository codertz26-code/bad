const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Tenor API (free, no key needed for basic usage)
const TENOR_API = 'https://tenor.googleapis.com/v2/search';

// Fetch GIF from Tenor
const fetchGif = async (query, limit = 1) => {
    try {
        const response = await axios.get(TENOR_API, {
            params: {
                q: query,
                key: 'AIzaSyC1I2H-FkFmNAdLpR2lLgW5G0P3zP6f8kY', // Public demo key
                client_key: 'sila-bot',
                limit: limit,
                media_filter: 'gif'
            }
        });

        if (!response.data.results || response.data.results.length === 0) {
            throw new Error('No GIFs found');
        }

        return response.data.results.map(result => ({
            url: result.media_formats?.gif?.url || result.media_formats?.tinygif?.url,
            preview: result.media_formats?.tinygif?.url,
            title: result.content_description,
            id: result.id
        }));
    } catch (error) {
        console.log('Error fetching GIF:', error);
        return [];
    }
};

// Download GIF
const downloadGif = async (url, outputPath) => {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(outputPath));
            writer.on('error', reject);
        });
    } catch (error) {
        console.log('Error downloading GIF:', error);
        throw error;
    }
};

// Random GIF
const randomGif = async (query = 'funny') => {
    const gifs = await fetchGif(query, 10);
    if (gifs.length === 0) return null;
    return gifs[Math.floor(Math.random() * gifs.length)];
};

module.exports = {
    fetchGif,
    downloadGif,
    randomGif
};