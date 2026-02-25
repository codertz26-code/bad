sila({ 
    nomCom: 'ping',
    alias: ['p'],
    reaction: '🏓',
    desc: 'Check bot response time',
    Categorie: 'General',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { repondre, sender } = commandeOptions;
    const start = Date.now();
    
    const msg = await zk.sendMessage(dest, {
        text: '🏓 *Pinging...*',
        contextInfo: getContextInfo({ sender })
    }, { quoted: global.fkontak });
    
    const end = Date.now();
    
    await zk.sendMessage(dest, {
        text: `🏓 *Pong!*\n⏱️ *Response:* ${end - start}ms`,
        contextInfo: getContextInfo({ sender })
    }, { quoted: global.fkontak });
});