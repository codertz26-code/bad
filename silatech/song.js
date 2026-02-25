const axios = require('axios');
const yts = require('yt-search');

sila({ 
    nomCom: 'song',
    alias: ['mp3', 'play', 'music', 'ytmp3', 'audio', 'songdl'],
    reaction: '🎵',
    desc: 'Download song with cover art from YouTube',
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
                text: `╭─── ✦  *𝚂𝙾𝙽𝙶 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ ❌ *Please provide a song name or YouTube link!*
┃
┃ 📌 *Usage:*
┃ ${global.botConfig.prefix}song [song name]
┃ ${global.botConfig.prefix}song [YouTube URL]
┃
┃ 📌 *Examples:*
┃ ${global.botConfig.prefix}song shape of you
┃ ${global.botConfig.prefix}song https://youtube.com/watch?v=...
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
        
        // First, search for the song
        let videoData = null;
        let isDirectUrl = false;
        
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            // It's a direct URL
            isDirectUrl = true;
            const videoId = query.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
            
            if (!videoId) {
                return await zk.sendMessage(dest, {
                    text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Invalid YouTube link!*
╰───────────⏧

> ${global.botConfig.botPower}`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: global.fkontak });
            }
            
            // Search to get video info
            const search = await yts({ videoId: videoId });
            if (search) videoData = search;
        } else {
            // It's a search query
            await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝚂𝙴𝙰𝚁𝙲𝙷𝙸𝙽𝙶*  ✦ ───⊷
┃ 🔍 *Searching YouTube for:* 
┃ "${query}"
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
            
            const search = await yts(query);
            if (!search || !search.all || search.all.length === 0) {
                return await zk.sendMessage(dest, {
                    text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *No results found for:* 
┃ "${query}"
╰───────────⏧

> ${global.botConfig.botPower}`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: global.fkontak });
            }
            
            videoData = search.all[0];
        }
        
        if (!videoData) {
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Could not get video information*
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }
        
        const videoUrl = videoData.url;
        const title = videoData.title || 'Unknown Title';
        const thumbnail = videoData.thumbnail || videoData.image;
        const duration = videoData.timestamp || videoData.duration || 'N/A';
        const views = videoData.views ? videoData.views.toLocaleString() : 'N/A';
        
        // Send the cover art/thumbnail with song info
        await zk.sendMessage(dest, {
            image: { url: thumbnail },
            caption: `╭─── ✦  *𝚂𝙾𝙽𝙶 𝙸𝙽𝙵𝙾*  ✦ ───⊷
┃ 🎵 *Title:* ${title}
┃ ⏱️ *Duration:* ${duration}
┃ 👁️ *Views:* ${views}
┃ 🔗 *URL:* ${videoUrl}
╰───────────⏧

⏳ *Downloading MP3...*

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        try {
            // Try using the alternative API first (since it works)
            const fallbackApi = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;
            
            const fallbackResponse = await axios.get(fallbackApi, { timeout: 30000 });
            const fallbackData = fallbackResponse.data;
            
            if (fallbackData?.status && fallbackData.audio) {
                // Send as audio file
                await zk.sendMessage(dest, {
                    audio: { url: fallbackData.audio },
                    mimetype: "audio/mpeg",
                    fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: global.fkontak });
                
                // Send as document file
                await zk.sendMessage(dest, {
                    document: { url: fallbackData.audio },
                    mimetype: "audio/mpeg",
                    fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: global.fkontak });
                
                // Success reaction
                await zk.sendMessage(dest, { 
                    react: { text: "✅", key: ms.key } 
                });
                
            } else {
                // Fallback to other method if needed
                const apiUrl = `https://meta-api.zone.id/downloader/youtube?url=${encodeURIComponent(videoUrl)}`;
                const response = await axios.get(apiUrl, { timeout: 30000 });
                const data = response.data;
                
                let audioUrl = data?.result?.audio || data?.result?.url;
                
                if (audioUrl) {
                    // Send as audio file
                    await zk.sendMessage(dest, {
                        audio: { url: audioUrl },
                        mimetype: "audio/mpeg",
                        fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`,
                        contextInfo: getContextInfo({ sender })
                    }, { quoted: global.fkontak });
                    
                    // Send as document file
                    await zk.sendMessage(dest, {
                        document: { url: audioUrl },
                        mimetype: "audio/mpeg",
                        fileName: `${title.substring(0, 50).replace(/[^\w\s]/gi, '')}.mp3`,
                        contextInfo: getContextInfo({ sender })
                    }, { quoted: global.fkontak });
                    
                    // Success reaction
                    await zk.sendMessage(dest, { 
                        react: { text: "✅", key: ms.key } 
                    });
                } else {
                    throw new Error('No audio URL found');
                }
            }
            
            // Send menu button after download
            const buttons = [
                { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 },
                { buttonId: `${global.botConfig.prefix}song ${query}`, buttonText: { displayText: "🔄 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙰𝙶𝙰𝙸𝙽" }, type: 1 }
            ];
            
            await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴*  ✦ ───⊷
┃ ✅ *Song downloaded successfully!*
┃ 🎵 *Title:* ${title.substring(0, 30)}...
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                footer: global.botConfig.botName,
                buttons: buttons,
                headerType: 1,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
            
        } catch (error) {
            console.error('Download error:', error.message);
            
            // Send error message
            await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to download audio*
┃ 📌 *Reason:* ${error.message}
┃
┃ 💡 Try again later or use different song
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
            
            // Error reaction
            await zk.sendMessage(dest, { 
                react: { text: "❌", key: ms.key } 
            });
        }
        
    } catch (e) {
        console.error('Song Command Error:', e);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Command failed:*
┃ 📌 ${e.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});