sila({ 
    nomCom: 'getdp',
    alias: ['dp', 'profilepic', 'pp', 'getpp', 'profile', 'avatars'],
    reaction: '🖼️',
    desc: 'Get profile picture of a user or group',
    Categorie: 'Tools',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { ms, repondre, sender, isGroup } = commandeOptions;
    
    try {
        // Determine whose DP to get
        let target;
        
        // Check if mentioned
        if (ms.message?.extendedTextMessage?.contextInfo?.mentionedJid && 
            ms.message.extendedTextMessage.contextInfo.mentionedJid[0]) {
            target = ms.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } 
        // Check if replying to someone
        else if (ms.message?.extendedTextMessage?.contextInfo?.participant) {
            target = ms.message.extendedTextMessage.contextInfo.participant;
        } 
        // Default to current chat
        else {
            target = dest;
        }

        // Fetch the Profile Picture URL
        let ppUrl;
        try {
            ppUrl = await zk.profilePictureUrl(target, 'image');
        } catch (e) {
            return await zk.sendMessage(dest, { 
                text: `╭─── ✦  *𝙿𝚁𝙾𝙵𝙸𝙻𝙴 𝙿𝙸𝙲𝚃𝚄𝚁𝙴*  ✦ ───⊷
┃ ❌ I couldn't fetch the profile picture.
┃ 🔒 It might be private or not set.
╰───────────⏧

> ${global.botConfig.botPower}`,
                contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
        }

        // Create buttons
        const buttons = [
            { buttonId: `${global.botConfig.prefix}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
        ];

        // Send the image
        await zk.sendMessage(dest, { 
            image: { url: ppUrl }, 
            caption: `╭─── ✦  *𝙿𝚁𝙾𝙵𝙸𝙻𝙴 𝙿𝙸𝙲𝚃𝚄𝚁𝙴*  ✦ ───⊷
┃ 🖼️ *User:* @${target.split('@')[0]}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
            mentions: [target],
            contextInfo: getContextInfo({ sender, mentionedJid: [target] })
        }, { quoted: global.fkontak });

        // Send button message separately
        await zk.sendMessage(dest, {
            text: `📌 *Bonyeza button kwenye menu*`,
            footer: global.botConfig.botName,
            buttons: buttons,
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });

    } catch (err) {
        console.error("❌ GetDP Error:", err);
        await zk.sendMessage(dest, { 
            text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ Error fetching profile picture.
┃ 📌 ${err.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});