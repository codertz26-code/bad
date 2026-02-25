const moment = require('moment-timezone');

sila({ 
    nomCom: 'uptime',
    alias: ['runtime', 'online', 'time', 'active', 'onlinetime', 'up', 'alive', 'botime', 'botstatus', 'statusbot', 'run', 'botrun', 'clock', 'timer', 'u', 'ut'],
    reaction: '⏰',
    desc: 'Show bot uptime',
    Categorie: 'General',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { repondre, prefixe, sender } = commandeOptions;
    
    // Calculate uptime
    const uptime = moment.duration(Date.now() - global.botStartTime);
    const days = uptime.days();
    const hours = uptime.hours();
    const minutes = uptime.minutes();
    const seconds = uptime.seconds();
    
    // Format uptime string
    let uptimeString = '';
    if (days > 0) uptimeString += `${days}d `;
    if (hours > 0) uptimeString += `${hours}h `;
    if (minutes > 0) uptimeString += `${minutes}m `;
    uptimeString += `${seconds}s`;
    
    // Single button for menu
    const buttons = [
        { buttonId: `${prefixe}menu`, buttonText: { displayText: "📋 𝙼𝙴𝙽𝚄" }, type: 1 }
    ];

    // Send only uptime with button
    await zk.sendMessage(dest, {
        text: `⏰ *Uptime:* ${uptimeString}`,
        footer: global.botConfig.botName,
        buttons: buttons,
        headerType: 1,
        contextInfo: getContextInfo({ sender })
    }, { quoted: global.fkontak });
});