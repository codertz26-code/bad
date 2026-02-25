sila({ 
    nomCom: 'allmenu',
    alias: ['all', 'menuall', 'commands', 'cmdlist'],
    reaction: '💀',
    desc: 'Show all available commands',
    Categorie: 'General',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { repondre, prefixe, sender } = commandeOptions;
    
    // Group commands by category
    const categories = {};
    for (const [name, cmd] of global.commands) {
        if (!cmd.isAlias) {
            const cat = cmd.Categorie || 'General';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push({ 
                name: cmd.nomCom || name, 
                desc: cmd.desc,
                reaction: cmd.reaction || '🤖'
            });
        }
    }
    
    let text = `╭─── ✦  *𝙰𝙻𝙻 𝙼𝙴𝙽𝚄*  ✦ ───⊷\n`;
    text += `┃ 🤖 *Bot:* ${global.botConfig.botName}\n`;
    text += `┃ 📊 *Total:* ${global.commands.size}\n`;
    text += `┃ 👤 *User:* @${dest.split('@')[0]}\n`;
    text += `╰───────────⏧\n\n`;
    
    for (const [category, cmds] of Object.entries(categories)) {
        text += `╭─── ✦  *${category}*  ✦ ───⊷\n`;
        for (const cmd of cmds) {
            text += `┃ ${cmd.reaction} *${prefixe}${cmd.name}* - ${cmd.desc || 'No description'}\n`;
        }
        text += `╰───────────⏧\n\n`;
    }
    
    text += `> ${global.botConfig.botPower}`;
    
    await zk.sendMessage(dest, {
        text: text,
        contextInfo: getContextInfo({ 
            mentionedJid: [sender],
            sender: sender 
        })
    }, { quoted: global.fkontak });
});