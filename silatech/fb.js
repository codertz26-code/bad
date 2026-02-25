const getFBInfo = require("@xaviabot/fb-downloader");
const fs = require("fs");
const path = require("path");

sila({ 
    nomCom: 'fb',
    alias: ['facebook', 'fbdl', 'facebookdl', 'fbdown', 'facebookdown'],
    reaction: '📽️',
    desc: 'Download Facebook videos',
    Categorie: 'Downloader',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { query, repondre, sender, ms } = commandeOptions;
    
    try {
        const fbUrl = query && query.trim();
        
        if (!fbUrl) {
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ ❌ *Please send a Facebook video link!*
┃
┃ 📌 *Example:*
┃ ${global.botConfig.prefix}fb https://facebook.com/...
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }
        
        if (!fbUrl.includes("https://") || !fbUrl.includes("facebook.com")) {
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ ❌ *Please send a valid Facebook video link!*
┃
┃ 📌 *Example:*
┃ ${global.botConfig.prefix}fb https://facebook.com/...
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }

        await zk.sendMessage(dest, {
            text: '⏳ *Fetching video...*',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });

        const videoData = await getFBInfo(fbUrl);

        if (!videoData || !videoData.sd) {
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ ❌ *Failed to fetch video.*
┃ 🔒 The link might be private or invalid.
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }

        const caption = `
╭─── ✦  *𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃
┃ 📌 *Title:* 
┃ ${videoData.title || 'No title available'}
┃
┃ ━━━━━━━━━━━━━━━━
┃ *🎬 REPLY WITH NUMBER BELOW*
┃ ━━━━━━━━━━━━━━━━
┃
┃ *📹 VIDEO*
┃ ➊ SD Quality
┃ ➋ HD Quality
┃
┃ *🎵 AUDIO*
┃ ➌ Audio Only
┃ ➍ As Document
┃ ➎ As Voice Message
┃
╰───────────⏧

> ${global.botConfig.botPower}
`;

        const sentMsg = await zk.sendMessage(dest, {
            image: { url: videoData.thumbnail || global.botConfig.botImage },
            caption: caption,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });

        // Reply handler for options
        const replyHandler = async (update) => {
            try {
                const msgs = update.messages[0];
                if (!msgs.message?.extendedTextMessage) return;
                
                const text = msgs.message.extendedTextMessage.text.trim();
                const quotedMsg = msgs.message.extendedTextMessage.contextInfo?.stanzaId;
                const replySender = msgs.key.participant || msgs.key.remoteJid;
                
                if (quotedMsg === sentMsg.key.id) {
                    await zk.sendMessage(dest, { 
                        react: { text: "⬇️", key: msgs.key } 
                    });

                    switch (text) {
                        case "1":
                        case "➊":
                            await zk.sendMessage(dest, {
                                video: { url: videoData.sd },
                                caption: `╭─── ✦  *𝚂𝙳 𝚀𝚄𝙰𝙻𝙸𝚃𝚈*  ✦ ───⊷
┃ ✅ Video downloaded successfully!
┃ 🤖 Bot: ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                contextInfo: getContextInfo({ sender: replySender })
                            }, { quoted: msgs });
                            break;
                            
                        case "2":
                        case "➋":
                            if (videoData.hd) {
                                await zk.sendMessage(dest, {
                                    video: { url: videoData.hd },
                                    caption: `╭─── ✦  *𝙷𝙳 𝚀𝚄𝙰𝙻𝙸𝚃𝚈*  ✦ ───⊷
┃ ✅ Video downloaded successfully!
┃ 🤖 Bot: ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                    contextInfo: getContextInfo({ sender: replySender })
                                }, { quoted: msgs });
                            } else {
                                await zk.sendMessage(dest, { 
                                    text: `╭─── ✦  *𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ ⚠️ HD not available. Sending SD quality.
╰───────────⏧

> ${global.botConfig.botPower}`,
                                    contextInfo: getContextInfo({ sender: replySender })
                                }, { quoted: msgs });
                                
                                await zk.sendMessage(dest, {
                                    video: { url: videoData.sd },
                                    caption: `╭─── ✦  *𝚂𝙳 𝚀𝚄𝙰𝙻𝙸𝚃𝚈*  ✦ ───⊷
┃ ✅ Video downloaded successfully!
┃ 🤖 Bot: ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                    contextInfo: getContextInfo({ sender: replySender })
                                }, { quoted: msgs });
                            }
                            break;
                            
                        case "3":
                        case "➌":
                            await zk.sendMessage(dest, {
                                audio: { url: videoData.sd },
                                mimetype: "audio/mpeg",
                                caption: `╭─── ✦  *𝙰𝚄𝙳𝙸𝙾 𝙾𝙽𝙻𝚈*  ✦ ───⊷
┃ ✅ Audio extracted successfully!
┃ 🤖 Bot: ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                contextInfo: getContextInfo({ sender: replySender })
                            }, { quoted: msgs });
                            break;
                            
                        case "4":
                        case "➍":
                            await zk.sendMessage(dest, {
                                document: { url: videoData.sd },
                                mimetype: "video/mp4",
                                fileName: `${global.botConfig.botName}_${Date.now()}.mp4`,
                                caption: `╭─── ✦  *𝙳𝙾𝙲𝚄𝙼𝙴𝙽𝚃*  ✦ ───⊷
┃ ✅ Video saved as document!
┃ 🤖 Bot: ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                contextInfo: getContextInfo({ sender: replySender })
                            }, { quoted: msgs });
                            break;
                            
                        case "5":
                        case "➎":
                            await zk.sendMessage(dest, {
                                audio: { url: videoData.sd },
                                mimetype: "audio/ogg; codecs=opus",
                                ptt: true,
                                caption: `╭─── ✦  *𝚅𝙾𝙸𝙲𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴*  ✦ ───⊷
┃ ✅ Voice message created!
┃ 🤖 Bot: ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                contextInfo: getContextInfo({ sender: replySender })
                            }, { quoted: msgs });
                            break;
                            
                        default:
                            await zk.sendMessage(dest, { 
                                text: `╭─── ✦  *𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ ❌ Please choose a number (1-5) only.
┃
┃ *Options:*
┃ ➊ SD Video
┃ ➋ HD Video
┃ ➌ Audio Only
┃ ➍ As Document
┃ ➎ Voice Message
╰───────────⏧

> ${global.botConfig.botPower}`,
                                contextInfo: getContextInfo({ sender: replySender })
                            }, { quoted: msgs });
                            break;
                    }
                    
                    await zk.sendMessage(dest, { 
                        react: { text: "✅", key: msgs.key } 
                    });
                }
            } catch (e) {
                console.error("❌ FB Reply Handler Error:", e);
            }
        };

        // Attach reply handler
        zk.ev.on("messages.upsert", replyHandler);

    } catch (error) {
        console.error("❌ FB Command Error:", error);
        await zk.sendMessage(dest, { 
            text: `╭─── ✦  *𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ ❌ *Error:*
┃ ${error.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});