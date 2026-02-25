 sila({ 
    nomCom: 'owner',
    alias: ['owner'],
    reaction: '👑',
    desc: 'Show owner info',
    Categorie: 'General',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { repondre, sender } = commandeOptions;

    const vcard = 'BEGIN:VCARD\n' +
                  'VERSION:3.0\n' +
                  `FN:${global.botConfig.ownerName}\n` +
                  `TEL;type=CELL;type=VOICE;waid=${global.botConfig.ownerNumber[0]}:+${global.botConfig.ownerNumber[0]}\n` +
                  'END:VCARD';

    await zk.sendMessage(dest, {
        contacts: {
            displayName: global.botConfig.ownerName,
            contacts: [{ vcard }]
        },
        contextInfo: getContextInfo({ sender })
    }, { quoted: global.fkontak });
});