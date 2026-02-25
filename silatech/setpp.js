const fs = require('fs-extra');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

sila({ 
    nomCom: 'setpp',
    alias: ['setprofile', 'setdp', 'setavatar', 'setpic', 'setphoto', 'setppbot', 'setprofilepic'],
    reaction: '🖼️',
    desc: 'Set bot profile picture (reply to image)',
    Categorie: 'Owner',
    fromMe: true
},
async(dest, zk, commandeOptions) => {
    const { ms, repondre, sender, isGroup } = commandeOptions;
    
    try {
        // Check if replying to an image or has image
        const quoted = ms.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = quoted?.imageMessage || ms.message?.imageMessage;
        
        if (!imageMsg) {
            const buttons = [
                { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
            ];
            
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝚂𝙴𝚃 𝙿𝚁𝙾𝙵𝙸𝙻𝙴 𝙿𝙸𝙲𝚃𝚄𝚁𝙴*  ✦ ───⊷
┃ ❌ *Please reply to an image!*
┃
┃ 📌 *How to use:*
┃ 1. Send an image
┃ 2. Reply to that image with: *${global.botConfig.prefix}setpp*
┃
┃ or
┃
┃ 1. Reply to any image
┃ 2. Type: *${global.botConfig.prefix}setpp*
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
            text: '⏳ *Setting profile picture...*',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });

        // Download image
        const stream = await downloadContentFromMessage(imageMsg, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Update profile picture
        await zk.updateProfilePicture(zk.user.id, buffer);

        // Success message with buttons
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 },
            { buttonId: `${global.botConfig.prefix}getdp`, buttonText: { displayText: "🖼️ 𝙶𝙴𝚃 𝙳𝙿" }, type: 1 }
        ];

        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝚂𝚄𝙲𝙲𝙴𝚂𝚂*  ✦ ───⊷
┃ ✅ *Profile picture updated successfully!*
┃ 🤖 *Bot:* ${global.botConfig.botName}
┃ ⚡ *Power:* ${global.botConfig.botPower}
╰───────────⏧

> Use *${global.botConfig.prefix}getdp* to see new profile picture`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });

        // Send reaction
        await zk.sendMessage(dest, { 
            react: { text: "✅", key: ms.key } 
        });

    } catch (error) {
        console.error("❌ SetPP Error:", error);
        
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
        ];

        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to set profile picture:*
┃ 📌 ${error.message}
┃
┃ 💡 Try with a smaller image or different format
╰───────────⏧

> ${global.botConfig.botPower}`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});