const fs = require('fs-extra');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

sila({ 
    nomCom: 'setgpp',
    alias: ['setgrouppp', 'setgpp', 'setgroupdp', 'grouppp', 'grouppic'],
    reaction: '🖼️',
    desc: 'Set group profile picture (reply to image)',
    Categorie: 'Group',
    fromMe: true
},
async(dest, zk, commandeOptions) => {
    const { ms, repondre, sender, isGroup } = commandeOptions;
    
    if (!isGroup) {
        return await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *This command is for groups only!*
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
    
    try {
        // Check if replying to an image or has image
        const quoted = ms.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = quoted?.imageMessage || ms.message?.imageMessage;
        
        if (!imageMsg) {
            const buttons = [
                { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
            ];
            
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝚂𝙴𝚃 𝙶𝚁𝙾𝚄𝙿 𝙿𝙸𝙲𝚃𝚄𝚁𝙴*  ✦ ───⊷
┃ ❌ *Please reply to an image!*
┃
┃ 📌 *How to use:*
┃ 1. Send an image to group
┃ 2. Reply to that image with: *${global.botConfig.prefix}setppgroup*
╰───────────⏧

> ${global.botConfig.botPower}`,
                footer: global.botConfig.botName,
                buttons: buttons,
                headerType: 1,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }

        // Send processing message
        await zk.sendMessage(dest, {
            text: '⏳ *Setting group profile picture...*',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });

        // Download image
        const stream = await downloadContentFromMessage(imageMsg, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Update group profile picture
        await zk.updateProfilePicture(dest, buffer);

        // Success message
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝚂𝚄𝙲𝙲𝙴𝚂𝚂*  ✦ ───⊷
┃ ✅ *Group profile picture updated successfully!*
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });

        // Send reaction
        await zk.sendMessage(dest, { 
            react: { text: "✅", key: ms.key } 
        });

    } catch (error) {
        console.error("❌ SetPPGroup Error:", error);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to set group profile picture:*
┃ 📌 ${error.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});