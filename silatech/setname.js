sila({ 
    nomCom: 'setname',
    alias: ['setgroupname', 'groupname', 'setgn', 'gn'],
    reaction: '✏️',
    desc: 'Set group subject/name',
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
            text: `╭─── ✦  *𝚂𝙴𝚃 𝙶𝚁𝙾𝚄𝙿 𝙽𝙰𝙼𝙴*  ✦ ───⊷
┃ ❌ *Please provide a group name!*
┃
┃ 📌 *Usage:*
┃ ${global.botConfig.prefix}setname [new group name]
┃
┃ 📌 *Example:*
┃ ${global.botConfig.prefix}setname BAD GUYS GROUP
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
            text: '⏳ *Changing group name...*',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        // Get old group name
        const groupMetadata = await zk.groupMetadata(dest);
        const oldName = groupMetadata.subject;
        
        // Update group name
        await zk.groupUpdateSubject(dest, query);
        
        // Success message with buttons
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 },
            { buttonId: `${global.botConfig.prefix}groupinfo`, buttonText: { displayText: "ℹ️ 𝙶𝚁𝙾𝚄𝙿 𝙸𝙽𝙵𝙾" }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙶𝚁𝙾𝚄𝙿 𝙽𝙰𝙼𝙴 𝚄𝙿𝙳𝙰𝚃𝙴𝙳*  ✦ ───⊷
┃ ✅ *Successfully changed group name!*
┃
┃ 📌 *Old Name:* ${oldName}
┃ 📌 *New Name:* ${query}
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
        console.error("❌ SetName Error:", error);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to change group name:*
┃ 📌 ${error.message}
┃
┃ 💡 Make sure I'm an admin
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});