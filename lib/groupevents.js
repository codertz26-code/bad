const fs = require('fs-extra');
const path = require('path');
const { isAdmin } = require('./functions');

// Welcome message handler
const handleWelcome = async (zk, groupId, participant, botNumber, settings) => {
    const groupSettings = settings.groups?.[groupId] || {};
    if (!groupSettings.welcome) return;

    const groupMetadata = await zk.groupMetadata(groupId);
    const groupName = groupMetadata.subject;
    const memberCount = groupMetadata.participants.length;
    
    const welcomeMessage = `╭─── ✦  *𝚆𝙴𝙻𝙲𝙾𝙼𝙴*  ✦ ───⊷
┃ 👋 *Welcome @${participant.split('@')[0]}!*
┃
┃ 📌 *Group:* ${groupName}
┃ 👥 *Members:* ${memberCount}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`;

    await zk.sendMessage(groupId, {
        text: welcomeMessage,
        mentions: [participant],
        contextInfo: getContextInfo({ mentionedJid: [participant] })
    }, { quoted: global.fkontak });
};

// Goodbye message handler
const handleGoodbye = async (zk, groupId, participant, botNumber, settings) => {
    const groupSettings = settings.groups?.[groupId] || {};
    if (!groupSettings.goodbye) return;

    const groupMetadata = await zk.groupMetadata(groupId);
    const groupName = groupMetadata.subject;
    const memberCount = groupMetadata.participants.length;
    
    const goodbyeMessage = `╭─── ✦  *𝙶𝙾𝙾𝙳𝙱𝚈𝙴*  ✦ ───⊷
┃ 👋 *@${participant.split('@')[0]} left the group*
┃
┃ 📌 *Group:* ${groupName}
┃ 👥 *Remaining:* ${memberCount}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`;

    await zk.sendMessage(groupId, {
        text: goodbyeMessage,
        mentions: [participant],
        contextInfo: getContextInfo({ mentionedJid: [participant] })
    }, { quoted: global.fkontak });
};

// Promote handler
const handlePromote = async (zk, groupId, actor, users, settings) => {
    const groupSettings = settings.groups?.[groupId] || {};
    if (!groupSettings.welcome && !groupSettings.goodbye) return;

    const groupMetadata = await zk.groupMetadata(groupId);
    const groupName = groupMetadata.subject;
    
    const promoteMessage = `╭─── ✦  *𝙿𝚁𝙾𝙼𝙾𝚃𝙴𝙳*  ✦ ───⊷
┃ 👑 *Congratulations @${users[0].split('@')[0]}!*
┃
┃ 📌 *Group:* ${groupName}
┃ 👤 *By:* @${actor.split('@')[0]}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`;

    await zk.sendMessage(groupId, {
        text: promoteMessage,
        mentions: [actor, users[0]],
        contextInfo: getContextInfo({ mentionedJid: [actor, users[0]] })
    }, { quoted: global.fkontak });
};

// Demote handler
const handleDemote = async (zk, groupId, actor, users, settings) => {
    const groupSettings = settings.groups?.[groupId] || {};
    if (!groupSettings.welcome && !groupSettings.goodbye) return;

    const groupMetadata = await zk.groupMetadata(groupId);
    const groupName = groupMetadata.subject;
    
    const demoteMessage = `╭─── ✦  *𝙳𝙴𝙼𝙾𝚃𝙴𝙳*  ✦ ───⊷
┃ 📉 *@${users[0].split('@')[0]} is no longer admin*
┃
┃ 📌 *Group:* ${groupName}
┃ 👤 *By:* @${actor.split('@')[0]}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`;

    await zk.sendMessage(groupId, {
        text: demoteMessage,
        mentions: [actor, users[0]],
        contextInfo: getContextInfo({ mentionedJid: [actor, users[0]] })
    }, { quoted: global.fkontak });
};

// Anti-tag handler (silent deletion)
const handleAntiTag = async (zk, msg, groupId, sender, isAdmin, settings) => {
    const groupSettings = settings.groups?.[groupId] || {};
    if (!groupSettings.antitag || isAdmin) return false;

    // Check if message has mentions
    const hasMentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0;
    
    if (hasMentions) {
        try {
            // Delete message silently
            await zk.sendMessage(groupId, {
                delete: {
                    remoteJid: groupId,
                    fromMe: false,
                    id: msg.key.id,
                    participant: sender
                }
            });
            return true;
        } catch (error) {
            console.log('Error deleting tagged message:', error);
            return false;
        }
    }
    return false;
};

// Anti-media handler (silent deletion)
const handleAntiMedia = async (zk, msg, groupId, sender, isAdmin, settings) => {
    const groupSettings = settings.groups?.[groupId] || {};
    if (!groupSettings.antimedia || isAdmin) return false;

    // Check if message contains media
    const hasMedia = 
        msg.message?.imageMessage ||
        msg.message?.videoMessage ||
        msg.message?.audioMessage ||
        msg.message?.documentMessage ||
        msg.message?.stickerMessage;
    
    if (hasMedia) {
        try {
            // Delete message silently
            await zk.sendMessage(groupId, {
                delete: {
                    remoteJid: groupId,
                    fromMe: false,
                    id: msg.key.id,
                    participant: sender
                }
            });
            return true;
        } catch (error) {
            console.log('Error deleting media:', error);
            return false;
        }
    }
    return false;
};

module.exports = {
    handleWelcome,
    handleGoodbye,
    handlePromote,
    handleDemote,
    handleAntiTag,
    handleAntiMedia
};