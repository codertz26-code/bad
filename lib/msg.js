const { downloadMedia } = require('./functions');

// Message types
const getMessageType = (msg) => {
    if (msg.message?.conversation) return 'conversation';
    if (msg.message?.imageMessage) return 'image';
    if (msg.message?.videoMessage) return 'video';
    if (msg.message?.audioMessage) return 'audio';
    if (msg.message?.stickerMessage) return 'sticker';
    if (msg.message?.documentMessage) return 'document';
    if (msg.message?.contactMessage) return 'contact';
    if (msg.message?.locationMessage) return 'location';
    if (msg.message?.liveLocationMessage) return 'liveLocation';
    if (msg.message?.extendedTextMessage) return 'extendedText';
    if (msg.message?.buttonsResponseMessage) return 'buttonsResponse';
    if (msg.message?.listResponseMessage) return 'listResponse';
    if (msg.message?.reactionMessage) return 'reaction';
    return 'unknown';
};

// Get message text
const getMessageText = (msg) => {
    if (msg.message?.conversation) return msg.message.conversation;
    if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
    if (msg.message?.imageMessage?.caption) return msg.message.imageMessage.caption;
    if (msg.message?.videoMessage?.caption) return msg.message.videoMessage.caption;
    return '';
};

// Get quoted message
const getQuotedMessage = (msg) => {
    return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
};

// Download media from message
const downloadMessageMedia = async (msg, type) => {
    try {
        let mediaMessage = null;
        
        if (type === 'image' && msg.message?.imageMessage) {
            mediaMessage = msg.message.imageMessage;
        } else if (type === 'video' && msg.message?.videoMessage) {
            mediaMessage = msg.message.videoMessage;
        } else if (type === 'audio' && msg.message?.audioMessage) {
            mediaMessage = msg.message.audioMessage;
        } else if (type === 'sticker' && msg.message?.stickerMessage) {
            mediaMessage = msg.message.stickerMessage;
        } else if (type === 'document' && msg.message?.documentMessage) {
            mediaMessage = msg.message.documentMessage;
        }

        if (!mediaMessage) return null;

        const stream = await downloadContentFromMessage(mediaMessage, type);
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        return buffer;
    } catch (error) {
        console.log('Error downloading media:', error);
        return null;
    }
};

// Send typing indicator
const sendTyping = async (zk, jid, duration = 1000) => {
    await zk.sendPresenceUpdate('composing', jid);
    await sleep(duration);
    await zk.sendPresenceUpdate('paused', jid);
};

// Send recording indicator
const sendRecording = async (zk, jid, duration = 1000) => {
    await zk.sendPresenceUpdate('recording', jid);
    await sleep(duration);
    await zk.sendPresenceUpdate('paused', jid);
};

module.exports = {
    getMessageType,
    getMessageText,
    getQuotedMessage,
    downloadMessageMedia,
    sendTyping,
    sendRecording
};