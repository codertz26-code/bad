const { saveSettings, loadSettings } = require('../lib/functions');

sila({ 
    nomCom: 'antitag',
    alias: ['antitagall', 'antitagall'],
    reaction: '🚫',
    desc: 'Toggle anti-tag feature (deletes messages with @tag silently)',
    Categorie: 'Group',
    fromMe: true
},
async(dest, zk, commandeOptions) => {
    const { args, repondre, sender, isGroup } = commandeOptions; // Removed ms
    
    if (!isGroup) {
        return await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *This command is for groups only!*
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
    
    const settings = await loadSettings();
    if (!settings.groups) settings.groups = {};
    if (!settings.groups[dest]) settings.groups[dest] = {};
    
    const current = settings.groups[dest].antitag || false;
    
    if (!args || args.length === 0) {
        const buttons = [
            { buttonId: `${global.botConfig.prefix}antitag on`, buttonText: { displayText: '✅ 𝙾𝙽' }, type: 1 },
            { buttonId: `${global.botConfig.prefix}antitag off`, buttonText: { displayText: '❌ 𝙾𝙵𝙵' }, type: 1 },
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: '📋 𝙼𝙴𝙽𝚄' }, type: 1 }
        ];
        
        return await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙰𝙽𝚃𝙸-𝚃𝙰𝙶*  ✦ ───⊷
┃ 📌 *Current status:* ${current ? '✅ ON' : '❌ OFF'}
┃
┃ 📌 *What it does:*
┃ • Deletes messages with @tag silently
┃ • No warning, no notification
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
    settings.groups[dest].antitag = newStatus;
    await saveSettings('groups', settings.groups);
    
    const successButtons = [
        { buttonId: `${global.botConfig.prefix}antitag`, buttonText: { displayText: '🔄 𝙲𝙷𝙴𝙲𝙺' }, type: 1 },
        { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: '📋 𝙼𝙴𝙽𝚄' }, type: 1 }
    ];
    
    await zk.sendMessage(dest, {
        text: `╭─── ✦  *𝙰𝙽𝚃𝙸-𝚃𝙰𝙶*  ✦ ───⊷
┃ ✅ *Anti-tag ${newStatus ? 'ENABLED' : 'DISABLED'}!*
┃ 🔇 *Mode:* Silent deletion (no warning)
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
});