const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Helper function to download media
const downloadMedia = async (url, type, title, dest, zk, sender, originalMsg) => {
    try {
        // Send processing message
        await zk.sendMessage(dest, {
            text: `⏳ *Downloading ${type === 'audio' ? 'Audio' : 'Video'}...*\n🎵 ${title.substring(0, 30)}...`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: originalMsg });
        
        // Try primary API
        const apiUrl = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(url)}`;
        
        try {
            const { data: apiRes } = await axios.get(apiUrl, { timeout: 15000 });
            
            if (apiRes?.status && apiRes.result?.media) {
                const mediaUrl = type === 'audio' ? apiRes.result.media.audio_url : apiRes.result.media.video_url;
                
                if (mediaUrl) {
                    if (type === 'audio') {
                        // Send as audio
                        await zk.sendMessage(dest, {
                            audio: { url: mediaUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
                            contextInfo: getContextInfo({ sender })
                        }, { quoted: originalMsg });
                    } else {
                        // Send as video
                        await zk.sendMessage(dest, {
                            video: { url: mediaUrl },
                            mimetype: "video/mp4",
                            caption: `🎬 *${title}*\n\n> ${global.botConfig.botPower}`,
                            contextInfo: getContextInfo({ sender })
                        }, { quoted: originalMsg });
                    }
                    return true;
                }
            }
        } catch (e) {
            console.log('Primary API failed, trying fallback...');
        }
        
        // Try fallback API
        const fallbackApi = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(url)}`;
        const fallbackRes = await axios.get(fallbackApi, { timeout: 30000 });
        
        if (fallbackRes.data?.status) {
            if (type === 'audio' && fallbackRes.data.audio) {
                // Send as audio
                await zk.sendMessage(dest, {
                    audio: { url: fallbackRes.data.audio },
                    mimetype: "audio/mpeg",
                    fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: originalMsg });
                return true;
            } else if (type === 'video' && fallbackRes.data.video) {
                // Send as video
                await zk.sendMessage(dest, {
                    video: { url: fallbackRes.data.video },
                    mimetype: "video/mp4",
                    caption: `🎬 *${title}*\n\n> ${global.botConfig.botPower}`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: originalMsg });
                return true;
            }
        }
        
        throw new Error('No media URL found');
        
    } catch (error) {
        console.error(`Download error (${type}):`, error);
        throw error;
    }
};

// Helper function to download media as document
const downloadMediaAsDoc = async (url, type, title, dest, zk, sender, originalMsg) => {
    try {
        // Send processing message
        await zk.sendMessage(dest, {
            text: `⏳ *Downloading ${type === 'audio' ? 'Audio' : 'Video'} as document...*\n📄 ${title.substring(0, 30)}...`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: originalMsg });
        
        // Try fallback API first (more reliable for docs)
        const fallbackApi = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(url)}`;
        const fallbackRes = await axios.get(fallbackApi, { timeout: 30000 });
        
        if (fallbackRes.data?.status) {
            if (type === 'audio' && fallbackRes.data.audio) {
                // Send as audio document
                await zk.sendMessage(dest, {
                    document: { url: fallbackRes.data.audio },
                    mimetype: "audio/mpeg",
                    fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
                    caption: `📄 *Audio Document*\n🎵 ${title}\n\n> ${global.botConfig.botPower}`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: originalMsg });
                return true;
            } else if (type === 'video' && fallbackRes.data.video) {
                // Send as video document
                await zk.sendMessage(dest, {
                    document: { url: fallbackRes.data.video },
                    mimetype: "video/mp4",
                    fileName: `${title.replace(/[^\w\s]/gi, '')}.mp4`,
                    caption: `📁 *Video Document*\n🎬 ${title}\n\n> ${global.botConfig.botPower}`,
                    contextInfo: getContextInfo({ sender })
                }, { quoted: originalMsg });
                return true;
            }
        }
        
        // Try primary API
        const apiUrl = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(url)}`;
        const { data: apiRes } = await axios.get(apiUrl, { timeout: 15000 });
        
        if (apiRes?.status && apiRes.result?.media) {
            const mediaUrl = type === 'audio' ? apiRes.result.media.audio_url : apiRes.result.media.video_url;
            
            if (mediaUrl) {
                if (type === 'audio') {
                    await zk.sendMessage(dest, {
                        document: { url: mediaUrl },
                        mimetype: "audio/mpeg",
                        fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
                        caption: `📄 *Audio Document*\n🎵 ${title}\n\n> ${global.botConfig.botPower}`,
                        contextInfo: getContextInfo({ sender })
                    }, { quoted: originalMsg });
                } else {
                    await zk.sendMessage(dest, {
                        document: { url: mediaUrl },
                        mimetype: "video/mp4",
                        fileName: `${title.replace(/[^\w\s]/gi, '')}.mp4`,
                        caption: `📁 *Video Document*\n🎬 ${title}\n\n> ${global.botConfig.botPower}`,
                        contextInfo: getContextInfo({ sender })
                    }, { quoted: originalMsg });
                }
                return true;
            }
        }
        
        throw new Error('No media URL found');
        
    } catch (error) {
        console.error(`Document download error (${type}):`, error);
        throw error;
    }
};

// Button handlers
sila({ 
    nomCom: 'song2_audio',
    alias: [],
    reaction: '🎵',
    desc: 'Download audio MP3',
    Categorie: 'Downloader',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { query, sender, ms } = commandeOptions;
    
    try {
        // Parse URL and title from query
        const parts = query.split('_');
        const url = decodeURIComponent(parts[0] || '');
        const title = decodeURIComponent(parts[1] || 'Unknown Title');
        
        if (!url) {
            return await zk.sendMessage(dest, {
                text: `❌ *Invalid request*`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }
        
        // Send reaction
        await zk.sendMessage(dest, { 
            react: { text: "⬇️", key: ms.key } 
        });
        
        // Download and send audio
        await downloadMedia(url, 'audio', title, dest, zk, sender, ms);
        
        // Success reaction
        await zk.sendMessage(dest, { 
            react: { text: "✅", key: ms.key } 
        });
        
        // Send menu button
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `✅ *Audio downloaded successfully!*\n🎵 ${title.substring(0, 30)}...`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
    } catch (error) {
        console.error('Audio button error:', error);
        
        await zk.sendMessage(dest, {
            text: `❌ *Failed to download audio:*\n${error.message}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        await zk.sendMessage(dest, { 
            react: { text: "❌", key: ms.key } 
        });
    }
});

sila({ 
    nomCom: 'song2_video',
    alias: [],
    reaction: '🎬',
    desc: 'Download video MP4',
    Categorie: 'Downloader',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { query, sender, ms } = commandeOptions;
    
    try {
        // Parse URL and title from query
        const parts = query.split('_');
        const url = decodeURIComponent(parts[0] || '');
        const title = decodeURIComponent(parts[1] || 'Unknown Title');
        
        if (!url) {
            return await zk.sendMessage(dest, {
                text: `❌ *Invalid request*`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }
        
        // Send reaction
        await zk.sendMessage(dest, { 
            react: { text: "⬇️", key: ms.key } 
        });
        
        // Download and send video
        await downloadMedia(url, 'video', title, dest, zk, sender, ms);
        
        // Success reaction
        await zk.sendMessage(dest, { 
            react: { text: "✅", key: ms.key } 
        });
        
        // Send menu button
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `✅ *Video downloaded successfully!*\n🎬 ${title.substring(0, 30)}...`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
    } catch (error) {
        console.error('Video button error:', error);
        
        await zk.sendMessage(dest, {
            text: `❌ *Failed to download video:*\n${error.message}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        await zk.sendMessage(dest, { 
            react: { text: "❌", key: ms.key } 
        });
    }
});

sila({ 
    nomCom: 'song2_audiodoc',
    alias: [],
    reaction: '📄',
    desc: 'Download audio as document',
    Categorie: 'Downloader',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { query, sender, ms } = commandeOptions;
    
    try {
        // Parse URL and title from query
        const parts = query.split('_');
        const url = decodeURIComponent(parts[0] || '');
        const title = decodeURIComponent(parts[1] || 'Unknown Title');
        
        if (!url) {
            return await zk.sendMessage(dest, {
                text: `❌ *Invalid request*`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }
        
        // Send reaction
        await zk.sendMessage(dest, { 
            react: { text: "⬇️", key: ms.key } 
        });
        
        // Download and send audio as document
        await downloadMediaAsDoc(url, 'audio', title, dest, zk, sender, ms);
        
        // Success reaction
        await zk.sendMessage(dest, { 
            react: { text: "✅", key: ms.key } 
        });
        
        // Send menu button
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `✅ *Audio document saved!*\n📄 ${title.substring(0, 30)}...`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
    } catch (error) {
        console.error('Audio doc button error:', error);
        
        await zk.sendMessage(dest, {
            text: `❌ *Failed to download audio document:*\n${error.message}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        await zk.sendMessage(dest, { 
            react: { text: "❌", key: ms.key } 
        });
    }
});

sila({ 
    nomCom: 'song2_videodoc',
    alias: [],
    reaction: '📁',
    desc: 'Download video as document',
    Categorie: 'Downloader',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { query, sender, ms } = commandeOptions;
    
    try {
        // Parse URL and title from query
        const parts = query.split('_');
        const url = decodeURIComponent(parts[0] || '');
        const title = decodeURIComponent(parts[1] || 'Unknown Title');
        
        if (!url) {
            return await zk.sendMessage(dest, {
                text: `❌ *Invalid request*`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }
        
        // Send reaction
        await zk.sendMessage(dest, { 
            react: { text: "⬇️", key: ms.key } 
        });
        
        // Download and send video as document
        await downloadMediaAsDoc(url, 'video', title, dest, zk, sender, ms);
        
        // Success reaction
        await zk.sendMessage(dest, { 
            react: { text: "✅", key: ms.key } 
        });
        
        // Send menu button
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `✅ *Video document saved!*\n📁 ${title.substring(0, 30)}...`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
    } catch (error) {
        console.error('Video doc button error:', error);
        
        await zk.sendMessage(dest, {
            text: `❌ *Failed to download video document:*\n${error.message}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        await zk.sendMessage(dest, { 
            react: { text: "❌", key: ms.key } 
        });
    }
});