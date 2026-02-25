const fs = require('fs-extra');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { imageToSticker } = require('../lib/sticker-utils');

sila({ 
    nomCom: 'sticker',
    alias: ['s', 'stiker'],
    reaction: '🖼️',
    desc: 'Convert image to sticker',
    Categorie: 'Tools',
    fromMe: false
},
async(dest, zk, commandeOptions) => {
    const { ms, repondre, sender } = commandeOptions;
    
    const quoted = ms.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage || ms.message?.imageMessage;
    
    if (!imageMsg) {
        return await zk.sendMessage(dest, {
            text: '❌ Please reply to an image or send an image with caption .sticker',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
    
    try {
        await zk.sendMessage(dest, {
            text: '⏳ *Creating sticker...*',
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        const stream = await downloadContentFromMessage(imageMsg, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        const inputPath = path.join(global.dbPath.converter, `input_${Date.now()}.jpg`);
        const outputPath = path.join(global.dbPath.converter, `output_${Date.now()}.webp`);
        
        await fs.writeFile(inputPath, buffer);
        await imageToSticker(inputPath, outputPath, global.botConfig.botName, global.botConfig.botPower);
        
        await zk.sendMessage(dest, {
            sticker: { url: outputPath },
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
        
        // Cleanup
        await fs.remove(inputPath);
        await fs.remove(outputPath);
    } catch (e) {
        await zk.sendMessage(dest, {
            text: `❌ Error: ${e.message}`,
            contextInfo: getContextInfo({ sender })
        }, { quoted: global.fkontak });
    }
});