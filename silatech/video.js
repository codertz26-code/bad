const axios = require('axios');
const yts = require('yt-search');

sila({ 
    nomCom: 'video',
    alias: ['ytmp4', 'mp4', 'ytv', 'videodl', 'ytvideo'],
    reaction: '🎥',
    desc: 'Download videos from YouTube',
    Categorie: 'Downloader',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { query, repondre, sender, ms } = commandeOptions;
    
    try {
        if (!query) {
            const buttons = [
                { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
            ];
            
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ 🎥 *Do you want to download video?*
┃
┃ 📌 *Usage:*
┃ ${global.botConfig.prefix}video [video name]
┃ ${global.botConfig.prefix}video [YouTube URL]
┃
┃ 📌 *Examples:*
┃ ${global.botConfig.prefix}video Cristiano Ronaldo goal
┃ ${global.botConfig.prefix}video https://youtube.com/watch?v=...
╰───────────⏧

> ${global.botConfig.botPower}`,
                footer: global.botConfig.botName,
                buttons: buttons,
                headerType: 1,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }
        
        // Send reaction
        await zk.sendMessage(dest, { 
            react: { text: "⏳", key: ms.key } 
        });
        
        // Send searching message
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝚂𝙴𝙰𝚁𝙲𝙷𝙸𝙽𝙶*  ✦ ───⊷
┃ 🔍 *Searching YouTube for:* 
┃ "${query}"
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        // Search for video
        const search = await yts(query);
        if (!search.videos || search.videos.length === 0) {
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Can't find any video for:*
┃ "${query}"
┃ 😭 *Sorry, try another search*
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }

        const data = search.videos[0];
        const ytUrl = data.url;

        // Download video using API
        const api = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(ytUrl)}`;
        const { data: apiRes } = await axios.get(api);

        if (!apiRes?.status || !apiRes.result?.media?.video_url) {
            // Try fallback API
            try {
                const fallbackApi = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(ytUrl)}`;
                const fallbackRes = await axios.get(fallbackApi, { timeout: 30000 });
                
                if (fallbackRes.data?.status && fallbackRes.data.video) {
                    // Send video info with thumbnail
                    const caption = `╭─── ✦  *𝚅𝙸𝙳𝙴𝙾 𝙸𝙽𝙵𝙾*  ✦ ───⊷
┃ 🎬 *Title:* ${data.title}
┃
┃ 🔗 *Link:* ${data.url}
┃ 👀 *Views:* ${data.views.toLocaleString()}
┃ ⏱️ *Duration:* ${data.timestamp}
┃
┃ 📝 *Choose your version by replying with:*
┃ 
┃ ❮1❯ 𝚂𝙸𝙼𝙿𝙻𝙴 𝚅𝙸𝙳𝙴𝙾
┃ ❮2❯ 𝙵𝙸𝙻𝙴 𝚅𝙸𝙳𝙴𝙾
╰───────────⏧

> ${global.botConfig.botPower}`;

                    const sentMsg = await zk.sendMessage(dest, { 
                        image: { url: data.thumbnail || global.botConfig.botImage }, 
                        caption: caption,
                        contextInfo: getContextInfo({ sender })
                    }, { quoted: global.fkontak });
                    
                    const messageID = sentMsg.key.id;

                    // Store handler for this specific message
                    const messageHandler = async (update) => {
                        try {
                            if (!update.messages) return;
                            
                            const receivedMsg = update.messages[0];
                            if (!receivedMsg?.message) return;

                            const receivedText = receivedMsg.message.conversation || 
                                                receivedMsg.message.extendedTextMessage?.text;
                            const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                            const senderID = receivedMsg.key.remoteJid;

                            if (isReplyToBot && senderID === dest) {
                                const choice = receivedText.trim();
                                
                                try {
                                    if (choice === "1" || choice === "➊") {
                                        // Send as simple video
                                        await zk.sendMessage(senderID, { 
                                            video: { url: fallbackRes.data.video }, 
                                            mimetype: "video/mp4",
                                            caption: `╭─── ✦  *𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳*  ✦ ───⊷
┃ ✅ *Video downloaded successfully!*
┃ 🎬 *Title:* ${data.title}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                            contextInfo: getContextInfo({ sender: senderID })
                                        }, { quoted: global.fkontak });
                                        
                                        // Success reaction
                                        await zk.sendMessage(dest, { 
                                            react: { text: "✅", key: receivedMsg.key } 
                                        });
                                        
                                    } else if (choice === "2" || choice === "➋") {
                                        // Send as document
                                        await zk.sendMessage(senderID, { 
                                            document: { url: fallbackRes.data.video }, 
                                            mimetype: "video/mp4", 
                                            fileName: `${data.title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp4`,
                                            caption: `╭─── ✦  *𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳*  ✦ ───⊷
┃ ✅ *Video saved as document!*
┃ 🎬 *Title:* ${data.title}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                            contextInfo: getContextInfo({ sender: senderID })
                                        }, { quoted: global.fkontak });
                                        
                                        // Success reaction
                                        await zk.sendMessage(dest, { 
                                            react: { text: "✅", key: receivedMsg.key } 
                                        });
                                        
                                    } else {
                                        await zk.sendMessage(senderID, { 
                                            text: `╭─── ✦  *𝚂𝙴𝙻𝙴𝙲𝚃𝙸𝙾𝙽*  ✦ ───⊷
┃ ❌ *Please reply with ❮1❯ or ❮2❯ only!*
┃
┃ ❮1❯ Simple Video
┃ ❮2❯ File Video
╰───────────⏧

> ${global.botConfig.botPower}`,
                                            contextInfo: getContextInfo({ sender: senderID })
                                        }, { quoted: global.fkontak });
                                    }
                                } catch (err) {
                                    console.error("Video send error:", err.message);
                                    await zk.sendMessage(senderID, { 
                                        text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to send video*
┃ 📌 ${err.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                        contextInfo: getContextInfo({ sender: senderID })
                                    }, { quoted: global.fkontak });
                                }
                                
                                // Remove listener
                                zk.ev.off('messages.upsert', messageHandler);
                            }
                        } catch (e) {
                            console.error('Reply handler error:', e);
                        }
                    };

                    // Add listener
                    zk.ev.on('messages.upsert', messageHandler);
                    
                    // Auto remove after 60 seconds
                    setTimeout(() => {
                        zk.ev.off('messages.upsert', messageHandler);
                    }, 60000);
                    
                    return;
                } else {
                    throw new Error('No video URL found');
                }
            } catch (fallbackError) {
                return await zk.sendMessage(dest, {
                    text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Video download failed!*
┃ 😔 *Please try again later*
╰───────────⏧

> ${global.botConfig.botPower}`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: global.fkontak });
            }
        }

        const result = apiRes.result.media;
        const caption = `╭─── ✦  *𝚅𝙸𝙳𝙴𝙾 𝙸𝙽𝙵𝙾*  ✦ ───⊷
┃ 🎬 *Title:* ${data.title}
┃
┃ 🔗 *Link:* ${data.url}
┃ 👀 *Views:* ${data.views.toLocaleString()}
┃ ⏱️ *Duration:* ${data.timestamp}
┃
┃ 📝 *Choose your version by replying with:*
┃ 
┃ ❮1❯ 𝚂𝙸𝙼𝙿𝙻𝙴 𝚅𝙸𝙳𝙴𝙾
┃ ❮2❯ 𝙵𝙸𝙻𝙴 𝚅𝙸𝙳𝙴𝙾
╰───────────⏧

> ${global.botConfig.botPower}`;

        const sentMsg = await zk.sendMessage(dest, { 
            image: { url: result.thumbnail || data.thumbnail || global.botConfig.botImage }, 
            caption: caption,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        const messageID = sentMsg.key.id;

        // Store handler for this specific message
        const messageHandler = async (update) => {
            try {
                if (!update.messages) return;
                
                const receivedMsg = update.messages[0];
                if (!receivedMsg?.message) return;

                const receivedText = receivedMsg.message.conversation || 
                                    receivedMsg.message.extendedTextMessage?.text;
                const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                const senderID = receivedMsg.key.remoteJid;

                if (isReplyToBot && senderID === dest) {
                    const choice = receivedText.trim();
                    
                    try {
                        if (choice === "1" || choice === "➊") {
                            // Send as simple video
                            await zk.sendMessage(senderID, { 
                                video: { url: result.video_url }, 
                                mimetype: "video/mp4",
                                caption: `╭─── ✦  *𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳*  ✦ ───⊷
┃ ✅ *Video downloaded successfully!*
┃ 🎬 *Title:* ${data.title}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                contextInfo: getContextInfo({ sender: senderID })
                            }, { quoted: global.fkontak });
                            
                            // Success reaction
                            await zk.sendMessage(dest, { 
                                react: { text: "✅", key: receivedMsg.key } 
                            });
                            
                        } else if (choice === "2" || choice === "➋") {
                            // Send as document
                            await zk.sendMessage(senderID, { 
                                document: { url: result.video_url }, 
                                mimetype: "video/mp4", 
                                fileName: `${data.title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp4`,
                                caption: `╭─── ✦  *𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳*  ✦ ───⊷
┃ ✅ *Video saved as document!*
┃ 🎬 *Title:* ${data.title}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                                contextInfo: getContextInfo({ sender: senderID })
                            }, { quoted: global.fkontak });
                            
                            // Success reaction
                            await zk.sendMessage(dest, { 
                                react: { text: "✅", key: receivedMsg.key } 
                            });
                            
                        } else {
                            await zk.sendMessage(senderID, { 
                                text: `╭─── ✦  *𝚂𝙴𝙻𝙴𝙲𝚃𝙸𝙾𝙽*  ✦ ───⊷
┃ ❌ *Please reply with ❮1❯ or ❮2❯ only!*
┃
┃ ❮1❯ Simple Video
┃ ❮2❯ File Video
╰───────────⏧

> ${global.botConfig.botPower}`,
                                contextInfo: getContextInfo({ sender: senderID })
                            }, { quoted: global.fkontak });
                        }
                    } catch (err) {
                        console.error("Video send error:", err.message);
                        await zk.sendMessage(senderID, { 
                            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to send video*
┃ 📌 ${err.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
                            contextInfo: getContextInfo({ sender: senderID })
                        }, { quoted: global.fkontak });
                    }
                    
                    // Remove listener
                    zk.ev.off('messages.upsert', messageHandler);
                }
            } catch (e) {
                console.error('Reply handler error:', e);
            }
        };

        // Add listener
        zk.ev.on('messages.upsert', messageHandler);
        
        // Auto remove after 60 seconds
        setTimeout(() => {
            zk.ev.off('messages.upsert', messageHandler);
        }, 60000);

    } catch (error) {
        console.error('Video Error:', error.message);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Video download failed!*
┃ 😔 *Please try again later*
┃ 📌 ${error.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        // Error reaction
        await zk.sendMessage(dest, { 
            react: { text: "❌", key: ms.key } 
        });
    }
});