const fs = require('fs-extra');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

sila({ 
    nomCom: 'gstatus',
    alias: ['groupstatus', 'poststatus', 'statusgroup', 'sharestatus', 'sendstatus'],
    reaction: '📢',
    desc: 'Post a status to group (text, image, video)',
    Categorie: 'Group',
    fromMe: true
},
async(dest, zk, commandeOptions) => {
    const { ms, query, repondre, sender, isGroup } = commandeOptions;
    
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
        // Check what type of status to post
        const quoted = ms.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = quoted?.imageMessage || ms.message?.imageMessage;
        const videoMsg = quoted?.videoMessage || ms.message?.videoMessage;
        const textMsg = query || ms.message?.conversation || ms.message?.extendedTextMessage?.text;
        
        // Send processing message
        await zk.sendMessage(dest, {
            text: '⏳ *Posting status to group...*',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        // Get group info
        const groupMetadata = await zk.groupMetadata(dest);
        const groupName = groupMetadata.subject;
        
        // Prepare status caption
        const statusCaption = `╭─── ✦  *𝙶𝚁𝙾𝚄𝙿 𝚂𝚃𝙰𝚃𝚄𝚂*  ✦ ───⊷
┃ 📌 *Group:* ${groupName}
┃ 👤 *Posted by:* @${sender.split('@')[0]}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`;
        
        // Post based on media type
        if (imageMsg) {
            // Download and post image
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            await zk.sendMessage(dest, {
                image: buffer,
                caption: statusCaption + (query ? `\n\n📝 *Message:* ${query}` : ''),
                mentions: [sender],
                contextInfo: getContextInfo({ sender, mentionedJid: [sender] })
            }, { quoted: global.fkontak });
            
        } else if (videoMsg) {
            // Download and post video
            const stream = await downloadContentFromMessage(videoMsg, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            await zk.sendMessage(dest, {
                video: buffer,
                caption: statusCaption + (query ? `\n\n📝 *Message:* ${query}` : ''),
                mentions: [sender],
                contextInfo: getContextInfo({ sender, mentionedJid: [sender] })
            }, { quoted: global.fkontak });
            
        } else if (textMsg) {
            // Post text status
            const textToPost = textMsg.replace(`${global.botConfig.prefix}gstatus`, '').trim();
            
            if (!textToPost) {
                return await zk.sendMessage(dest, {
                    text: `╭─── ✦  *𝙶𝚁𝙾𝚄𝙿 𝚂𝚃𝙰𝚃𝚄𝚂*  ✦ ───⊷
┃ ❌ *Please provide text or reply to media!*
┃
┃ 📌 *Usage:*
┃ ${global.botConfig.prefix}gstatus [your status text]
┃ ${global.botConfig.prefix}gstatus [reply to image/video]
┃
┃ 📌 *Examples:*
┃ ${global.botConfig.prefix}gstatus Hello everyone!
┃ ${global.botConfig.prefix}gstatus Check this out! (reply to image)
╰───────────⏧

> ${global.botConfig.botPower}`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: global.fkontak });
            }
            
            await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙶𝚁𝙾𝚄𝙿 𝚂𝚃𝙰𝚃𝚄𝚂*  ✦ ───⊷
┃ 📌 *Group:* ${groupName}
┃ 👤 *Posted by:* @${sender.split('@')[0]}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

📝 *Message:*
${textToPost}

> ${global.botConfig.botPower}`,
                mentions: [sender],
                contextInfo: getContextInfo({ sender, mentionedJid: [sender] })
            }, { quoted: global.fkontak });
            
        } else {
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙶𝚁𝙾𝚄𝙿 𝚂𝚃𝙰𝚃𝚄𝚂*  ✦ ───⊷
┃ ❌ *Please provide text or reply to media!*
┃
┃ 📌 *Usage:*
┃ ${global.botConfig.prefix}gstatus [your status text]
┃ ${global.botConfig.prefix}gstatus [reply to image/video]
┃
┃ 📌 *Examples:*
┃ ${global.botConfig.prefix}gstatus Hello everyone!
┃ ${global.botConfig.prefix}gstatus Check this out! (reply to image)
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }
        
        // Success reaction
        await zk.sendMessage(dest, { 
            react: { text: "✅", key: ms.key } 
        });
        
        // Send menu button
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `✅ *Status posted successfully to ${groupName}!*`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
    } catch (error) {
        console.error("❌ GStatus Error:", error);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to post status:*
┃ 📌 ${error.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});