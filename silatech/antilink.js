const { saveSettings, loadSettings } = require('../lib/functions');

sila({ 
    nomCom: 'antilink',
    alias: ['antilink'],
    reaction: '🛡️',
    desc: 'Toggle anti-link feature',
    Categorie: 'Group',
    fromMe: true
},
async(dest, zk, commandeOptions) => {
    const { args, repondre, sender, isGroup } = commandeOptions;
    
    if (!isGroup) {
        return await zk.sendMessage(dest, {
            text: '❌ This command is for groups only!',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
    
    const settings = await loadSettings();
    
    if (args[0] === 'on') {
        settings.antiLink = true;
        await saveSettings('antiLink', true);
        await zk.sendMessage(dest, {
            text: '✅ Anti-link enabled',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    } else if (args[0] === 'off') {
        settings.antiLink = false;
        await saveSettings('antiLink', false);
        await zk.sendMessage(dest, {
            text: '❌ Anti-link disabled',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    } else {
        await zk.sendMessage(dest, {
            text: `Current status: ${settings.antiLink ? 'ON' : 'OFF'}\nUsage: .antilink on/off`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});