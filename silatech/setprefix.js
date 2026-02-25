const { saveSettings, loadSettings } = require('../lib/functions');

sila({ 
    nomCom: 'setprefix',
    alias: ['prefix'],
    reaction: '🔧',
    desc: 'Change bot prefix',
    Categorie: 'Owner',
    fromMe: true
},
async(dest, zk, commandeOptions) => {
    const { args, repondre, sender } = commandeOptions;
    
    if (args.length === 0) {
        return repondre('❌ Usage: .setprefix <new prefix> or "none"');
    }
    
    const newPrefix = args[0] === 'none' ? '' : args[0];
    await saveSettings('prefix', newPrefix);
    
    await zk.sendMessage(dest, {
        text: `✅ Prefix changed to: ${newPrefix || 'NO PREFIX (command without prefix)'}`,
        contextInfo: getContextInfo({ sender })
    }, { quoted: global.fkontak });
});