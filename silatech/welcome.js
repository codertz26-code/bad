const { saveSettings, loadSettings } = require('../lib/functions');

sila({ 
    nomCom: 'welcome',
    alias: ['setwelcome', 'welcomemsg', 'wlc'],
    reaction: '👋',
    desc: 'Toggle welcome message for new members',
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
        
        const current = settings.groups[dest].welcome || false;
        
        if (!args || args.length === 0) {
            const buttons = [
                { buttonId: `${prefixe}welcome on`, buttonText: { displayText: '✅ 𝙾𝙽' }, type: 1 },
                { buttonId: `${prefixe}welcome off`, buttonText: { displayText: '❌ 𝙾𝙵𝙵' }, type: 1 },
                { buttonId: `${prefixe}menu`, buttonText: { displayText: '📋 𝙼𝙴𝙽𝚄' }, type: 1 }
            ];
            
            return await zk.sendMessage(dest, {
                text: `╭─── ✦  *𝚆𝙴𝙻𝙲𝙾𝙼𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴*  ✦ ───⊷
┃ 📌 *Current status:* ${current ? '✅ ON' : '❌ OFF'}
┃
┃ 📌 *What it does:*
┃ • Sends welcome message when new member joins
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
        settings.groups[dest].welcome = newStatus;
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
            { buttonId: `${prefixe}welcome`, buttonText: { displayText: '🔄 𝙲𝙷𝙴𝙲𝙺' }, type: 1 },
            { buttonId: `${prefixe}menu`, buttonText: { displayText: '📋 𝙼𝙴𝙽𝚄' }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝚆𝙴𝙻𝙲𝙾𝙼𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴*  ✦ ───⊷
┃ ✅ *Welcome message ${newStatus ? 'ENABLED' : 'DISABLED'}!*
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
        console.error('❌ Welcome Command Error:', error);
        
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