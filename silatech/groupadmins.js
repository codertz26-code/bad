sila({ 
    nomCom: 'admins',
    alias: ['listadmins', 'adminlist', 'gadmin', 'grupadmin'],
    reaction: '👑',
    desc: 'List all group admins',
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
        const groupMetadata = await zk.groupMetadata(dest);
        const groupName = groupMetadata.subject;
        
        // Get all admins
        const admins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        const superAdmins = admins.filter(p => p.admin === 'superadmin');
        const normalAdmins = admins.filter(p => p.admin === 'admin');
        
        let adminList = '';
        let mentions = [];
        
        if (superAdmins.length > 0) {
            adminList += `\n👑 *SUPER ADMINS:*\n`;
            superAdmins.forEach((admin, i) => {
                adminList += `${i+1}. @${admin.id.split('@')[0]}\n`;
                mentions.push(admin.id);
            });
        }
        
        if (normalAdmins.length > 0) {
            adminList += `\n👮 *ADMINS:*\n`;
            normalAdmins.forEach((admin, i) => {
                adminList += `${i+1}. @${admin.id.split('@')[0]}\n`;
                mentions.push(admin.id);
            });
        }
        
        if (admins.length === 0) {
            adminList = '\n┃ No admins found';
        }
        
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 },
            { buttonId: `${global.botConfig.prefix}groupinfo`, buttonText: { displayText: "ℹ️ 𝙶𝚁𝙾𝚄𝙿 𝙸𝙽𝙵𝙾" }, type: 1 }
        ];
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙶𝚁𝙾𝚄𝙿 𝙰𝙳𝙼𝙸𝙽𝚂*  ✦ ───⊷
┃ 📌 *Group:* ${groupName}
┃ 👥 *Total Admins:* ${admins.length}
${adminList}
┃
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            mentions: mentions,
            contextInfo: getContextInfo({ sender, mentionedJid: mentions })
        }, { quoted: global.fkontak });
        
    } catch (error) {
        console.error("❌ Admins Error:", error);
        
        await zk.sendMessage(dest, {
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ *Failed to get admins:*
┃ 📌 ${error.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});