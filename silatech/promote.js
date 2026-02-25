sila({ 
    nomCom: 'promote',
    alias: ['promote', 'admin', 'makeadmin', 'addadmin'],
    reaction: '👑',
    desc: 'Promote member to admin',
    Categorie: 'Group',
    fromMe: true
},
async(dest, zk, commandeOptions) => {
    const { ms, repondre, sender, isGroup } = commandeOptions;
    
    if (!isGroup) {
        return await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *This command is for groups only!*
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
    
    // Get mentioned user or replied user
    let target;
    const quoted = ms.message?.extendedTextMessage?.contextInfo;
    
    if (quoted?.mentionedJid && quoted.mentionedJid[0]) {
        target = quoted.mentionedJid[0];
    } else if (quoted?.participant) {
        target = quoted.participant;
    } else {
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
        ];
        
        return await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙿𝚁𝙾𝙼𝙾𝚃𝙴*  ✦ ───⊷
┃ ❌ *Please tag or reply to the member you want to promote!*
┃
┃ 📌 *Usage:*
┃ ${global.botConfig.prefix}promote @user
┃ or reply to user's message with ${global.botConfig.prefix}promote
╰───────────⏧

> ${global.botConfig.botPower}`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
    
    try {
        // Send processing
        await zk.sendMessage(dest, {
            text: '⏳ *Promoting member...*',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        // Promote
        await zk.groupParticipantsUpdate(dest, [target], 'promote');
        
        // Success message (silent - only visible to admins)
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙿𝚁𝙾𝙼𝙾𝚃𝙴𝙳*  ✦ ───⊷
┃ ✅ *Successfully promoted*
┃ 👤 *User:* @${target.split('@')[0]}
┃ 👑 *By:* @${sender.split('@')[0]}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
            mentions: [target, sender],
            contextInfo: getContextInfo({ sender, mentionedJid: [target, sender] })
        }, { quoted: global.fkontak });
        
        // Reaction
        await zk.sendMessage(dest, { 
            react: { text: "✅", key: ms.key } 
        });
        
    } catch (error) {
        console.error("❌ Promote Error:", error);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to promote:*
┃ 📌 ${error.message}
┃
┃ 💡 Make sure I'm an admin
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});