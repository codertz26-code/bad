const { igdl } = require("ruhend-scraper");

sila({ 
    nomCom: 'ig',
    alias: ['insta', 'instagram', 'reels', 'igdl', 'instadl', 'instagramdl'],
    reaction: '📸',
    desc: 'Download Instagram media (posts, reels, stories)',
    Categorie: 'Downloader',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { query, repondre, sender, ms } = commandeOptions;
    
    // Prevent duplicate processing
    if (!global.processedMessages) global.processedMessages = new Set();
    if (global.processedMessages.has(ms.key.id)) return;
    global.processedMessages.add(ms.key.id);
    setTimeout(() => global.processedMessages.delete(ms.key.id), 5 * 60 * 1000);

    try {
        if (!query) {
            return await zk.sendMessage(dest, { 
                text: `╭─── ✦  *𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ 📸 *Please provide an Instagram link!*
┃
┃ 📌 *Example:*
┃ ${global.botConfig.prefix}ig https://www.instagram.com/p/xxxxx
┃ ${global.botConfig.prefix}ig https://www.instagram.com/reel/xxxxx
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }

        // Send reaction
        await zk.sendMessage(dest, { 
            react: { text: "⏳", key: ms.key } 
        });

        // Send processing message
        await zk.sendMessage(dest, {
            text: '⏳ *Fetching Instagram media...*',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });

        // Download Instagram media
        const downloadData = await igdl(query);
        
        if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
            return await zk.sendMessage(dest, { 
                text: `╭─── ✦  *𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*  ✦ ───⊷
┃ ❌ *No media found.*
┃ 🔒 Make sure the link is public and valid.
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }

        // Filter unique media URLs
        const uniqueMedia = [];
        const seenUrls = new Set();
        for (const media of downloadData.data) {
            if (media.url && !seenUrls.has(media.url)) {
                seenUrls.add(media.url);
                uniqueMedia.push(media);
            }
        }

        // Send each media
        for (let i = 0; i < uniqueMedia.length; i++) {
            const media = uniqueMedia[i];
            
            // Check if video
            const isVideo = 
                /\.(mp4|mov|avi|mkv|webm)/i.test(media.url) || 
                media.type === 'video' || 
                query.includes('/reel/') || 
                query.includes('/tv/') ||
                query.includes('/reels/');

            if (isVideo) {
                await zk.sendMessage(dest, {
                    video: { url: media.url },
                    caption: `╭─── ✦  *𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝚅𝙸𝙳𝙴𝙾*  ✦ ───⊷
┃ ✅ *Downloaded successfully!*
┃ 📊 *Media:* ${i + 1}/${uniqueMedia.length}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                    mimetype: "video/mp4",
                    fileName: `${global.botConfig.botName}_insta_${Date.now()}.mp4`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: global.fkontak });
            } else {
                await zk.sendMessage(dest, {
                    image: { url: media.url },
                    caption: `╭─── ✦  *𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝙸𝙼𝙰𝙶𝙴*  ✦ ───⊷
┃ ✅ *Downloaded successfully!*
┃ 📊 *Media:* ${i + 1}/${uniqueMedia.length}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: global.fkontak });
            }

            // Delay between multiple media
            if (uniqueMedia.length > 1) await new Promise(r => setTimeout(r, 1500));
        }

        // Send success reaction
        await zk.sendMessage(dest, { 
            react: { text: "✅", key: ms.key } 
        });

        // Send menu button
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
        ];

        await zk.sendMessage(dest, {
            text: `📌 *Download complete!*\n📸 Total media: ${uniqueMedia.length}`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });

    } catch (e) {
        console.error("❌ Instagram Download Error:", e);
        await zk.sendMessage(dest, { 
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to download:*
┃ 📌 ${e.message}
┃ 
┃ 💡 Make sure the link is valid and public.
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});