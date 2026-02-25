const fs = require('fs-extra');
const path = require('path');

// Bot Configuration - Inachukua kutoka Heroku env
global.botConfig = {
    // Bot Info
    botName: '𝙱𝚄𝙳 𝙶𝚄𝚈𝚂',
    botPower: 'ᴾᵒʷᵉʳᵈ ᵇʸ ᴮᵃᵈ ᴳᵘʸˢ ᴴᵃᶜᵏᵉʳˢ',
    prefix: '.',
    ownerNumber: [process.env.OWNER_NUMBER || '255637351031'], // Inachukua kutoka Heroku
    ownerName: '𝙱𝙰𝙳 𝙶𝚄𝚈𝚂',

    // Session ID (kwa ajili ya kudownload session kutoka Mega)
    SESSION_ID: process.env.SESSION_ID || '', // Inachukua kutoka Heroku

    // Features Status (default)
    features: {
        autoView: true,
        autoLike: true,
        autoReply: false,
        antiLink: false,
        antiBadWords: false,
        antiDelete: false,
        welcome: false,
        goodbye: false,
        autoTyping: true,
        autoRecording: false
    },

    // Newsletter JIDs
    newsletter: {
        autoFollow: process.env.NEWSLETTER_ID || '120363421404091643@newsletter',
        autoReact: process.env.NEWSLETTER_ID || '120363421404091643@newsletter'
    },

    // Media URL - Picha Moja Tu
    botImage: 'https://files.catbox.moe/brou6d.jpg',

    // API Keys
    apis: {
        ai: 'https://api.yupra.my.id/api/ai/gpt5?text=',
        youtube: 'https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=',
        ytdl: 'https://yt-dl.officialhectormanuel.workers.dev/?url='
    }
};

// Database paths
global.dbPath = {
    antidel: path.join(__dirname, 'data', 'antidel'),
    converter: path.join(__dirname, 'data', 'converter'),
    settings: path.join(__dirname, 'data', 'settings.json'),
    features: path.join(__dirname, 'data', 'features.json')
};

// Ensure directories exist
fs.ensureDirSync(global.dbPath.antidel);
fs.ensureDirSync(global.dbPath.converter);
fs.ensureDirSync(path.join(__dirname, 'data'));

// Fake VCard (for quoted messages)
global.fkontak = {
    "key": {
        "participant": '0@s.whatsapp.net',
        "remoteJid": '0@s.whatsapp.net',
        "fromMe": false,
        "id": "Halo"
    },
    "message": {
        "conversation": "𝚂𝙸𝙻𝙰"
    }
};

// Context Info Generator - Picha Moja Tu
global.getContextInfo = (options = {}) => {
    const { mentionedJid = [], sender = '' } = options;
    return {
        mentionedJid: Array.isArray(mentionedJid) ? mentionedJid : [mentionedJid],
        externalAdReply: {
            title: global.botConfig.botName,
            body: global.botConfig.botPower,
            mediaType: 1,
            previewType: 0,
            thumbnailUrl: global.botConfig.botImage,
            sourceUrl: 'https://silamd.com/',
            renderLargerThumbnail: false
        }
    };
};