const fs = require('fs-extra');
const path = require('path');

// List of random emojis for reactions
const reactionEmojis = [
    '👍', '❤️', '🔥', '🥰', '👏', '😁', '🎉', '🤩', '👌', '💯',
    '🤣', '😍', '✨', '🌟', '⭐', '✅', '💪', '🙏', '⚡', '💫',
    '😎', '🥳', '💥', '💖', '💗', '💓', '💞', '💕', '💘', '💝'
];

sila({ 
    nomCom: 'autoreact',
    alias: ['autoreaction', 'react', 'autoreacts', 'setreact'],
    reaction: '🔁',
    desc: 'Toggle auto reaction feature (on/off)',
    Categorie: 'Config',
    fromMe: true
},
async(dest, zk, commandeOptions) => {
    const { ms, args, repondre, prefixe, sender } = commandeOptions;
    
    // Path to features config file
    const featuresPath = path.join(__dirname, '..', 'data', 'features.json');
    
    // Ensure directory exists
    fs.ensureDirSync(path.join(__dirname, '..', 'data'));
    
    // Load or create features config
    let features = {};
    if (fs.existsSync(featuresPath)) {
        features = fs.readJSONSync(featuresPath);
    }
    
    const key = 'AUTOREACT_STATUS';
    const current = features[key] || 'no';
    
    // If no arguments, show buttons
    if (!args || args.length === 0) {
        const buttons = [
            { buttonId: `${prefixe}autoreact on`, buttonText: { displayText: '✅ 𝙾𝙽' }, type: 1 },
            { buttonId: `${prefixe}autoreact off`, buttonText: { displayText: '❌ 𝙾𝙵𝙵' }, type: 1 },
            { buttonId: `${prefixe}menu`, buttonText: { displayText: '📋 𝙼𝙴𝙽𝚄' }, type: 1 }
        ];
        
        const caption = `╭─── ✦  *𝙰𝚄𝚃𝙾 𝚁𝙴𝙰𝙲𝚃*  ✦ ───⊷
┃ 📌 *Current Status:* ${current === 'yes' ? '✅ ON' : '❌ OFF'}
┃
┃ 🔁 *What it does:*
┃ • Automatically reacts to messages with random emojis
┃ • ${reactionEmojis.slice(0, 10).join(' ')}
┃ • And many more...
┃
┃ 👤 *Choose option below:*
╰───────────⏧

> ${global.botConfig.botPower}`;

        await zk.sendMessage(dest, { 
            text: caption, 
            footer: global.botConfig.botName, 
            buttons: buttons, 
            headerType: 1,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        return;
    }

    // Process the argument
    let next = current;
    
    if (args && args[0]) {
        const a = args[0].toString().toLowerCase();
        if (a === 'on' || a === 'yes' || a === 'enable') next = 'yes';
        if (a === 'off' || a === 'no' || a === 'disable') next = 'no';
    }
    
    // Save to features file
    features[key] = next;
    fs.writeJSONSync(featuresPath, features, { spaces: 2 });
    
    // Success message with button
    const successButtons = [
        { buttonId: `${prefixe}autoreact`, buttonText: { displayText: '🔄 𝙲𝙷𝙴𝙲𝙺' }, type: 1 },
        { buttonId: `${prefixe}menu`, buttonText: { displayText: '📋 𝙼𝙴𝙽𝚄' }, type: 1 }
    ];
    
    await zk.sendMessage(dest, {
        text: `╭─── ✦  *𝙰𝚄𝚃𝙾 𝚁𝙴𝙰𝙲𝚃*  ✦ ───⊷
┃ ✅ *Auto React ${next === 'yes' ? 'ENABLED' : 'DISABLED'}!*
┃
┃ 📌 *Status:* ${next === 'yes' ? '✅ ON' : '❌ OFF'}
┃ 🔁 *Bot will ${next === 'yes' ? 'now' : 'no longer'} react to messages*
┃ 👤 *Changed by:* @${sender.split('@')[0]}
┃ 🤖 *Bot:* ${global.botConfig.botName}
╰───────────⏧

> ${global.botConfig.botPower}`,
        footer: global.botConfig.botName,
        buttons: successButtons,
        headerType: 1,
        mentions: [sender],
        contextInfo: getContextInfo({ sender, mentionedJid: [sender] })
    }, { quoted: global.fkontak });
    
    // Send reaction
    await zk.sendMessage(dest, { 
        react: { text: "✅", key: ms.key } 
    });
});