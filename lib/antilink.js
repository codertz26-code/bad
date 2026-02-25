const { extractUrls } = require('./functions');

// Common link patterns
const linkPatterns = [
    'chat.whatsapp.com',
    'whatsapp.com/channel',
    'youtube.com',
    'youtu.be',
    'instagram.com',
    'facebook.com',
    'fb.com',
    'tiktok.com',
    'twitter.com',
    'x.com',
    't.me',
    'telegram.org',
    'discord.gg',
    'discord.com',
    'github.com',
    'bit.ly',
    'tinyurl.com',
    'shorturl.at'
];

// Check if message contains links
const hasLinks = (text) => {
    if (!text) return false;
    const urls = extractUrls(text);
    if (urls.length === 0) return false;

    // Check each URL against patterns
    for (const url of urls) {
        for (const pattern of linkPatterns) {
            if (url.includes(pattern)) return true;
        }
    }
    return false;
};

// Check for bad words
const hasBadWords = (text, badWordsList = []) => {
    if (!text || badWordsList.length === 0) return false;
    const lowerText = text.toLowerCase();
    return badWordsList.some(word => lowerText.includes(word.toLowerCase()));
};

// Handle anti-link
const handleAntiLink = async (zk, msg, groupId, sender, isAdmin, settings) => {
    if (!settings.antiLink || isAdmin) return false;

    const text = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text || 
                 msg.message?.imageMessage?.caption || 
                 msg.message?.videoMessage?.caption || '';

    if (hasLinks(text)) {
        try {
            // Delete message
            await zk.sendMessage(groupId, {
                delete: {
                    remoteJid: groupId,
                    fromMe: false,
                    id: msg.key.id,
                    participant: sender
                }
            });

            // Warn user
            const warnMessage = `┏━❑ ᴀɴᴛɪ-ʟɪɴᴋ ━━━━━━━━━
┃ ⚠️ @${sender.split('@')[0]}
┃ ❌ ʟɪɴᴋs ᴀʀᴇ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ ɪɴ ᴛʜɪs ɢʀᴏᴜᴘ!
┃ 🤖 *${global.botConfig.botName}*
┗━━━━━━━━━━━━━━━━━━━━
> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${global.botConfig.botPower}`;

            await zk.sendMessage(groupId, {
                text: warnMessage,
                contextInfo: {
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: global.botConfig.botName,
                        body: global.botConfig.botPower,
                        mediaType: 1,
                        thumbnailUrl: global.botConfig.media.botProfile,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: global.fkontak });

            return true;
        } catch (error) {
            console.log('Error deleting message:', error);
            return false;
        }
    }
    return false;
};

module.exports = {
    handleAntiLink,
    hasLinks,
    hasBadWords,
    linkPatterns
};