const axios = require('axios');
const yts = require('yt-search');

sila({ 
    nomCom: 'song2',
    alias: ['song2', 'video2', 'music2', 'yt2', 'media2'],
    reaction: '🎵',
    desc: 'Download songs/videos with 4 button options',
    Categorie: 'Downloader',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { query, repondre, sender, ms, prefixe } = commandeOptions;
    
    try {
        if (!query) {
            const buttons = [
                { buttonId: `${prefixe}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
            ];
            
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝚂𝙾𝙽𝙶2 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ 🎵 *Please provide a song name or YouTube link!*
┃
┃ 📌 *Usage:*
┃ ${prefixe}song2 [song name]
┃ ${prefixe}song2 [YouTube URL]
┃
┃ 📌 *Example:*
┃ ${prefixe}song2 shape of you
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
        let videoData = null;
        let isDirectUrl = false;
        let videoUrl = '';
        let title = '';
        let thumbnail = '';
        let duration = '';
        let views = '';
        
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
            if (search) {
                videoData = search;
                videoUrl = videoData.url;
                title = videoData.title || 'Unknown Title';
                thumbnail = videoData.thumbnail || videoData.image;
                duration = videoData.timestamp || videoData.duration || 'N/A';
                views = videoData.views ? videoData.views.toLocaleString() : 'N/A';
            } else {
                videoUrl = query;
                title = 'YouTube Video';
                thumbnail = global.botConfig.botImage;
                duration = 'N/A';
                views = 'N/A';
            }
        } else {
            // It's a search query
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
            videoUrl = videoData.url;
            title = videoData.title || 'Unknown Title';
            thumbnail = videoData.thumbnail || videoData.image;
            duration = videoData.timestamp || videoData.duration || 'N/A';
            views = videoData.views ? videoData.views.toLocaleString() : 'N/A';
        }
        
        // Send the cover art/thumbnail with song info and 4 buttons
        const buttons = [
            { buttonId: `${prefixe}song2_audio_${encodeURIComponent(videoUrl)}_${encodeURIComponent(title)}`, buttonText: { displayText: "🎵 𝙰𝚄𝙳𝙸𝙾 𝙼𝙿3" }, type: 1 },
            { buttonId: `${prefixe}song2_video_${encodeURIComponent(videoUrl)}_${encodeURIComponent(title)}`, buttonText: { displayText: "🎬 𝚅𝙸𝙳𝙴𝙾 𝙼𝙿4" }, type: 1 },
            { buttonId: `${prefixe}song2_audiodoc_${encodeURIComponent(videoUrl)}_${encodeURIComponent(title)}`, buttonText: { displayText: "📄 𝙰𝚄𝙳𝙸𝙾 𝙳𝙾𝙲" }, type: 1 },
            { buttonId: `${prefixe}song2_videodoc_${encodeURIComponent(videoUrl)}_${encodeURIComponent(title)}`, buttonText: { displayText: "📁 𝚅𝙸𝙳𝙴𝙾 𝙳𝙾𝙲" }, type: 1 }
        ];

        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝚂𝙾𝙽𝙶2 𝙼𝙴𝙳𝙸𝙰 𝙿𝙻𝙰𝚈𝙴𝚁*  ✦ ───⊷
┃ 🎵 *Title:* ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}
┃ ⏱️ *Duration:* ${duration}
┃ 👁️ *Views:* ${views}
┃
┃ 📌 *Choose download option below:*
┃ 
┃ 🎵 Audio MP3 - Download as audio
┃ 🎬 Video MP4 - Download as video
┃ 📄 Audio DOC - Audio as document
┃ 📁 Video DOC - Video as document
╰───────────⏧

> ${global.botConfig.botPower}`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        // Also send thumbnail
        await zk.sendMessage(dest, {
            image: { url: thumbnail },
            caption: `📌 *Now playing:* ${title}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
    } catch (e) {
        console.error('Song2 Command Error:', e);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Command failed:*
┃ 📌 ${e.message}
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