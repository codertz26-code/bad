sila({ 
    nomCom: 'setdesc',
    alias: ['setdescription', 'groupdesc', 'setgroupdesc', 'setabout', 'settopic'],
    reaction: '📝',
    desc: 'Set group description',
    Categorie: 'Group',
    fromMe: true
},
async(dest, zk, commandeOptions) => {
    const { query, repondre, sender, isGroup } = commandeOptions;
    
    if (!isGroup) {
        return await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *This command is for groups only!*
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
    
    if (!query) {
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
        ];
        
        return await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝚂𝙴𝚃 𝙶𝚁𝙾𝚄𝙿 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽*  ✦ ───⊷
┃ ❌ *Please provide a group description!*
┃
┃ 📌 *Usage:*
┃ ${global.botConfig.prefix}setdesc [new description]
┃
┃ 📌 *Example:*
┃ ${global.botConfig.prefix}setdesc Welcome to BAD GUYS group! Follow rules.
╰───────────⏧

> ${global.botConfig.botPower}`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
    
    try {
        // Send processing message
        await zk.sendMessage(dest, {
            text: '⏳ *Changing group description...*',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        // Get old description
        const groupMetadata = await zk.groupMetadata(dest);
        const oldDesc = groupMetadata.desc || 'No description';
        
        // Update group description
        await zk.groupUpdateDescription(dest, query);
        
        // Success message with buttons
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 },
            { buttonId: `${global.botConfig.prefix}groupinfo`, buttonText: { displayText: "ℹ️ 𝙶𝚁𝙾𝚄𝙿 𝙸𝙽𝙵𝙾" }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙶𝚁𝙾𝚄𝙿 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽 𝚄𝙿𝙳𝙰𝚃𝙴𝙳*  ✦ ───⊷
┃ ✅ *Successfully changed group description!*
┃
┃ 📌 *Old Description:*
┃ ${oldDesc}
┃
┃ 📌 *New Description:*
┃ ${query}
┃
┃ 👤 *Changed by:* @${sender.split('@')[0]}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            mentions: [sender],
            contextInfo: getContextInfo({ sender, mentionedJid: [sender] })
        }, { quoted: global.fkontak });
        
        // Send reaction
        await zk.sendMessage(dest, { 
            react: { text: "✅", key: ms.key } 
        });
        
    } catch (error) {
        console.error("❌ SetDesc Error:", error);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to change group description:*
┃ 📌 ${error.message}
┃
┃ 💡 Make sure I'm an admin
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});