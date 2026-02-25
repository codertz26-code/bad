const moment = require('moment-timezone');

sila({ 
    nomCom: 'alive',
    alias: ['runtime', 'uptime'],
    reaction: '🤖',
    desc: 'Check bot status',
    Categorie: 'General',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { repondre, sender } = commandeOptions;
    const uptime = moment.duration(Date.now() - global.botStartTime);
    
    const text = `┏━❑ 𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒 ━━━━━━━━━
┃ 🤖 *Name:* ${global.botConfig.botName}
┃ ⏰ *Uptime:* ${uptime.days()}d ${uptime.hours()}h ${uptime.minutes()}m
┃ 📊 *Commands:* ${global.commands.size}
┃ 💬 *Messages:* ${global.msgCounter}
┃ 📍 *Status:* ✅ Online
┗━━━━━━━━━━━━━━━━━━━━

> ${global.botConfig.botPower}`;

    await zk.sendMessage(dest, {
        text: text,
        contextInfo: getContextInfo({ sender })
    }, { quoted: global.fkontak });
});