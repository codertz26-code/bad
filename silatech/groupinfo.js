sila({ 
    nomCom: 'groupinfo',
    alias: ['ginfo', 'grupinfo', 'infogrup', 'gdetails'],
    reaction: 'ℹ️',
    desc: 'Get group information',
    Categorie: 'Group',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { repondre, sender, isGroup } = commandeOptions;
    
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
        // Get group metadata
        const groupMetadata = await zk.groupMetadata(dest);
        const participants = groupMetadata.participants;
        const groupName = groupMetadata.subject;
        const groupDesc = groupMetadata.desc || 'No description';
        const groupOwner = groupMetadata.owner || participants.find(p => p.admin === 'superadmin')?.id || 'Unknown';
        const groupCreation = groupMetadata.creation || 0;
        const groupSize = participants.length;
        
        // Count admins
        const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length;
        
        // Format creation date
        const creationDate = groupCreation ? new Date(groupCreation * 1000).toLocaleDateString() : 'Unknown';
        
        // Get group invite link
        let groupLink = 'Unable to get link';
        try {
            const code = await zk.groupInviteCode(dest);
            groupLink = `https://chat.whatsapp.com/${code}`;
        } catch (e) {
            groupLink = 'Make me admin to get link';
        }
        
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 },
            { buttonId: `${global.botConfig.prefix}admins`, buttonText: { displayText: "👑 𝙰𝙳𝙼𝙸𝙽𝚂" }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙶𝚁𝙾𝚄𝙿 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽*  ✦ ───⊷
┃
┃ 📌 *Group Name:* ${groupName}
┃ 👥 *Members:* ${groupSize}
┃ 👑 *Admins:* ${admins}
┃ 👤 *Owner:* @${groupOwner.split('@')[0]}
┃ 📅 *Created:* ${creationDate}
┃
┃ 📝 *Description:*
┃ ${groupDesc}
┃
┃ 🔗 *Invite Link:*
┃ ${groupLink}
┃
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            mentions: [groupOwner],
            contextInfo: getContextInfo({ sender, mentionedJid: [groupOwner] })
        }, { quoted: global.fkontak });
        
    } catch (error) {
        console.error("❌ GroupInfo Error:", error);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to get group info:*
┃ 📌 ${error.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});