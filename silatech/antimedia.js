const { saveSettings, loadSettings } = require('../lib/functions');

sila({ 
    nomCom: 'antimedia',
    alias: ['antimedia', 'antimed', 'nomedia'],
    reaction: '📵',
    desc: 'Toggle anti-media feature (deletes all media silently)',
    Categorie: 'Group',
    fromMe: true
},
async(dest, zk, commandeOptions) => {
    const { args, repondre, sender, isGroup, prefixe } = commandeOptions;
    
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
        const settings = await loadSettings();
        
        // Hakikisha settings.groups ipo
        if (!settings.groups) settings.groups = {};
        if (!settings.groups[dest]) settings.groups[dest] = {};
        
        const current = settings.groups[dest].antimedia || false;
        
        if (!args || args.length === 0) {
            const buttons = [
                { buttonId: `${prefixe}antimedia on`, buttonText: { displayText: '✅ 𝙾𝙽' }, type: 1 },
                { buttonId: `${prefixe}antimedia off`, buttonText: { displayText: '❌ 𝙾𝙵𝙵' }, type: 1 },
                { buttonId: `${prefixe}menu`, buttonText: { displayText: '📋 𝙼𝙴𝙽𝚄' }, type: 1 }
            ];
            
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙰𝙽𝚃𝙸-𝙼𝙴𝙳𝙸𝙰*  ✦ ───⊷
┃ 📌 *Current status:* ${current ? '✅ ON' : '❌ OFF'}
┃
┃ 📌 *What it deletes silently:*
┃ • 🖼️ Images
┃ • 🎥 Videos
┃ • 🎵 Audio
┃ • 📄 Documents
┃ • 🎨 Stickers
┃
┃ 👤 *Choose option below:*
╰───────────⏧

> ${global.botConfig.botPower}`,
                footer: global.botConfig.botName,
                buttons: buttons,
                headerType: 1,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }
        
        const newStatus = args[0].toLowerCase() === 'on';
        
        // Update settings
        settings.groups[dest].antimedia = newStatus;
        const saved = await saveSettings('groups', settings.groups);
        
        if (!saved) {
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to save settings!*
┃ 📌 Please check bot permissions
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }
        
        const successButtons = [
            { buttonId: `${prefixe}antimedia`, buttonText: { displayText: '🔄 𝙲𝙷𝙴𝙲𝙺' }, type: 1 },
            { buttonId: `${prefixe}menu`, buttonText: { displayText: '📋 𝙼𝙴𝙽𝚄' }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙰𝙽𝚃𝙸-𝙼𝙴𝙳𝙸𝙰*  ✦ ───⊷
┃ ✅ *Anti-media ${newStatus ? 'ENABLED' : 'DISABLED'}!*
┃ 🔇 *Mode:* Silent deletion (no warning)
┃ 📵 *Media types:* All images, videos, audio, docs
┃ 👤 *Changed by:* @${sender.split('@')[0]}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
            footer: global.botConfig.botName,
            buttons: successButtons,
            headerType: 1,
            mentions: [sender],
            contextInfo: getContextInfo({ sender, mentionedJid: [sender] })
        }, { quoted: global.fkontak });
        
    } catch (error) {
        console.error('❌ AntiMedia Command Error:', error);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Command failed:*
┃ 📌 ${error.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});