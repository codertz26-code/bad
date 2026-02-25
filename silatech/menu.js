const { formatTime } = require('../lib/functions');

sila({ 
    nomCom: 'menu',
    alias: ['help', 'cmd', 'commands', 'h', 'menü', 'menyu'],
    reaction: '💀',
    desc: 'Show bot menu',
    Categorie: 'General',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { repondre, prefixe, sender } = commandeOptions;

    // Buttons zikichukua commands kutoka silatech folder
    const buttons = [
        { buttonId: `${prefixe}allmenu`, buttonText: { displayText: "📋 𝙰𝙻𝙻 𝙼𝙴𝙽𝚄" }, type: 1 },
        { buttonId: `${prefixe}uptime`, buttonText: { displayText: "⏰ 𝚄𝙿𝚃𝙸𝙼𝙴" }, type: 1 },
        { buttonId: `${prefixe}owner`, buttonText: { displayText: "👑 𝙾𝚆𝙽𝙴𝚁" }, type: 1 },
        { buttonId: `${prefixe}ping`, buttonText: { displayText: "🏓 𝙿𝙸𝙽𝙶" }, type: 1 },
        { buttonId: `${prefixe}alive`, buttonText: { displayText: "🤖 𝙰𝙻𝙸𝚅𝙴" }, type: 1 }
    ];

    await zk.sendMessage(dest, {
        text: `╭─── ✦  *𝙱𝚄𝙳 𝙶𝚄𝚈𝚂*  ✦ ───⊷
┃ 🤖 *Bot:* ${global.botConfig.botName}
┃ ⚡ *Power:* ${global.botConfig.botPower}
┃ ⏰ *Time:* ${formatTime()}
┃ 👤 *User:* @${dest.split('@')[0]}
┃ 📊 *Commands:* ${global.commands.size}
╰───────────⏧

> *📌 Bonyeza button kuchagua menu*`,
        footer: global.botConfig.botName,
        buttons: buttons,
        headerType: 1,
        contextInfo: getContextInfo({ 
            mentionedJid: [sender],
            sender: sender 
        })
    }, { quoted: global.fkontak });
});