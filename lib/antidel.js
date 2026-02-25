const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');
const { formatTime } = require('./functions');

// Save deleted message
const saveDeletedMessage = async (msg, groupId, sender, isGroup) => {
    try {
        const messageData = {
            id: msg.key.id,
            sender: sender,
            groupId: isGroup ? groupId : null,
            isGroup: isGroup,
            timestamp: msg.messageTimestamp,
            time: formatTime(),
            message: msg.message
        };

        const fileName = `${Date.now()}_${msg.key.id}.json`;
        const filePath = path.join(global.dbPath.antidel, fileName);
        await fs.writeJSON(filePath, messageData, { spaces: 2 });

        return filePath;
    } catch (error) {
        console.log('Error saving deleted message:', error);
        return null;
    }
};

// Handle anti-delete
const handleAntiDelete = async (zk, msg, update, settings, ownerNumber) => {
    if (!settings.antiDelete) return;

    try {
        // Check if it's a delete event
        if (!update?.update?.messages) return;

        const messages = update.update.messages;
        for (const message of messages) {
            if (message.key?.fromMe) continue;

            // Check if message was deleted (has 'message' null but 'messageStubType' exists)
            if (message.message === null) {
                // This is likely a delete event
                const deletedMsgInfo = await saveDeletedMessage(
                    message, 
                    message.key.remoteJid, 
                    message.key.participant || message.key.remoteJid,
                    message.key.remoteJid.endsWith('@g.us')
                );

                if (deletedMsgInfo && ownerNumber) {
                    // Send to owner's inbox
                    const ownerJid = ownerNumber + '@s.whatsapp.net';
                    const deleteAlert = `┏━❑ ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ ━━━━━━━━━
┃ 📁 ᴍᴇssᴀɢᴇ ᴅᴇʟᴇᴛᴇᴅ ᴅᴇᴛᴇᴄᴛᴇᴅ!
┃ 👤 *ꜰʀᴏᴍ:* @${message.key.participant?.split('@')[0] || 'unknown'}
┃ 💬 *ɢʀᴏᴜᴘ:* ${message.key.remoteJid.endsWith('@g.us') ? message.key.remoteJid : 'ᴘʀɪᴠᴀᴛᴇ'}
┃ ⏰ *ᴛɪᴍᴇ:* ${formatTime()}
┃ 📍 *ꜰɪʟᴇ:* ${path.basename(deletedMsgInfo)}
┗━━━━━━━━━━━━━━━━━━━━
> ᴍᴇssᴀɢᴇ ꜰɪʟᴇ ꜱᴀᴠᴇᴅ ᴀɴᴅ ᴄᴀɴ ʙᴇ ʀᴇᴛʀɪᴇᴠᴇᴅ`;

                    await zk.sendMessage(ownerJid, {
                        text: deleteAlert,
                        contextInfo: {
                            mentionedJid: [message.key.participant],
                            externalAdReply: {
                                title: global.botConfig.botName,
                                body: global.botConfig.botPower,
                                mediaType: 1,
                                thumbnailUrl: global.botConfig.media.botProfile,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: global.fkontak });
                }
            }
        }
    } catch (error) {
        console.log('Error in anti-delete handler:', error);
    }
};

module.exports = {
    handleAntiDelete,
    saveDeletedMessage
};