console.clear();
console.log("Starting BUD GUYS Bot...");

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  getContentType,
  downloadContentFromMessage,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const Pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const moment = require('moment-timezone');
const chalk = require('chalk');
const { File } = require('megajs');
const express = require("express");
const os = require('os');
const qrcode = require('qrcode-terminal');

// ============ CONFIG ============
const app = express();
const port = process.env.PORT || 9090;

// Bot Configuration
global.botConfig = {
    botName: 'BUD GUYS',
    botPower: 'Powered by BAD GUYS HACKERS',
    prefix: '.',
    ownerNumber: process.env.OWNER_NUMBER ? [process.env.OWNER_NUMBER] : ['255637351031'],
    ownerName: 'BAD GUYS',
    SESSION_ID: process.env.SESSION_ID || '',
    botImage: 'https://files.catbox.moe/brou6d.jpg',
    apis: {
        ai: 'https://api.yupra.my.id/api/ai/gpt5?text=',
        youtube: 'https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=',
        ytdl: 'https://yt-dl.officialhectormanuel.workers.dev/?url='
    }
};

// Global variables
global.msgCounter = 0;
global.botStartTime = Date.now();
global.commands = new Map();
global.reconnectAttempts = 0;
global.maxReconnectAttempts = 10;
global.games = {};
global.conn = null;
global.sessionDownloaded = false; // Flag to prevent multiple downloads

// Temp directory
const tempDir = path.join(os.tmpdir(), 'budguys-temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Clear temp directory every 5 minutes
setInterval(() => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return;
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), () => {});
    }
  });
}, 5 * 60 * 1000);

// ============ FAKE VCARD & CONTEXT INFO ============
global.fkontak = {
    "key": {
        "participant": '0@s.whatsapp.net',
        "remoteJid": '0@s.whatsapp.net',
        "fromMe": false,
        "id": "Halo"
    },
    "message": {
        "conversation": "BUD GUYS"
    }
};

global.getContextInfo = (options = {}) => {
    const { mentionedJid = [], sender = '' } = options;
    return {
        mentionedJid: Array.isArray(mentionedJid) ? mentionedJid : [mentionedJid],
        externalAdReply: {
            title: global.botConfig.botName,
            body: global.botConfig.botPower,
            mediaType: 1,
            previewType: 0,
            thumbnailUrl: global.botConfig.botImage,
            sourceUrl: 'https://github.com/',
            renderLargerThumbnail: false
        }
    };
};

// ============ COMMAND REGISTRATION ============
global.sila = (commandInfo, callback) => {
    const { nomCom, alias = [], reaction = '🤖', desc = '', Categorie = 'General', fromMe = false } = commandInfo;
    
    const cmdData = {
        nomCom,
        alias: Array.isArray(alias) ? alias : [alias],
        reaction,
        desc,
        Categorie,
        fromMe,
        callback
    };
    
    global.commands.set(nomCom.toLowerCase(), cmdData);
    
    for (const a of cmdData.alias) {
        global.commands.set(a.toLowerCase(), { ...cmdData, isAlias: true });
    }
};

// ============ LOAD COMMANDS ============
const loadCommands = () => {
    const silatechDir = path.join(__dirname, 'silatech');
    
    if (!fs.existsSync(silatechDir)) {
        fs.mkdirSync(silatechDir, { recursive: true });
    }

    const files = fs.readdirSync(silatechDir).filter(file => file.endsWith('.js'));
    console.log(`Loading ${files.length} commands...`);
    
    for (const file of files) {
        try {
            require(path.join(silatechDir, file));
            console.log(`  ✅ Loaded: ${file}`);
        } catch (e) {
            console.error(`❌ Failed to load ${file}:`, e.message);
        }
    }
    
    console.log(`✅ Total commands: ${global.commands.size}`);
};

// ============ SESSION HANDLING ============
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

// Download session from Mega if SESSION_ID exists - WITHOUT EXITING
const downloadSessionIfNeeded = async () => {
  // Check if session already exists or already downloaded
  if (fs.existsSync(path.join(sessionsDir, 'creds.json'))) {
    console.log("✅ Session already exists");
    return true;
  }
  
  if (global.sessionDownloaded) {
    return true;
  }
  
  if (!global.botConfig.SESSION_ID) {
    console.log("No SESSION_ID provided, will use QR code");
    return false;
  }
  
  const sessdata = global.botConfig.SESSION_ID.replace("sila~", '').trim();
  if (!sessdata) {
    console.log("Invalid SESSION_ID format");
    return false;
  }
  
  console.log('Downloading session from Mega...');
  
  return new Promise((resolve) => {
    const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
    filer.download((err, data) => {
      if (err) {
        console.log('Failed to download session:', err.message);
        resolve(false);
      } else {
        fs.writeFileSync(path.join(sessionsDir, 'creds.json'), data);
        console.log("✅ Session downloaded successfully");
        global.sessionDownloaded = true;
        resolve(true);
      }
    });
  });
};

// ============ HELPER FUNCTIONS ============
const isAdmin = async (zk, groupId, userId) => {
    try {
        const groupMetadata = await zk.groupMetadata(groupId);
        const participant = groupMetadata.participants.find(p => p.id === userId);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
        return false;
    }
};

const formatTime = (timezone = 'Africa/Nairobi') => {
    return moment().tz(timezone).format('DD/MM/YYYY HH:mm:ss');
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============ MESSAGE SERIALIZER ============
const sms = (conn, m) => {
    if (!m) return m;
    
    let msg = {
        key: m.key,
        message: m.message,
        messageTimestamp: m.messageTimestamp,
        pushName: m.pushName,
        broadcast: m.key?.remoteJid === 'status@broadcast',
    };
    
    const type = getContentType(m.message);
    msg.type = type;
    
    if (type === 'conversation') msg.text = m.message.conversation;
    else if (type === 'extendedTextMessage') msg.text = m.message.extendedTextMessage.text;
    else if (type === 'imageMessage') msg.text = m.message.imageMessage.caption || '';
    else if (type === 'videoMessage') msg.text = m.message.videoMessage.caption || '';
    
    msg.sender = m.key?.participant || m.key?.remoteJid;
    msg.chat = m.key?.remoteJid;
    msg.isGroup = msg.chat?.endsWith('@g.us') || false;
    msg.mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    msg.reply = async (text, options = {}) => {
        return await conn.sendMessage(msg.chat, { 
            text: text, 
            ...options,
            contextInfo: getContextInfo({ sender: msg.sender })
        }, { quoted: m });
    };
    
    msg.react = async (emoji) => {
        return await conn.sendMessage(msg.chat, {
            react: {
                text: emoji,
                key: m.key
            }
        });
    };
    
    return msg;
};

// ============ WHATSAPP CONNECTION ============
async function connectToWA() {
  try {
    // Download session first without exiting
    await downloadSessionIfNeeded();
    
    console.log("Connecting to WhatsApp...");

    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      logger: Pino({ level: 'silent' }),
      printQRInTerminal: true,
      browser: Browsers.macOS("Firefox"),
      syncFullHistory: true,
      auth: state,
      version
    });

    global.conn = sock;

    // Connection update handler
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('Scan QR code with WhatsApp:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        
        if (statusCode === DisconnectReason.loggedOut) {
          console.log('Bot logged out, deleting sessions folder');
          await fs.remove(sessionsDir);
          setTimeout(() => connectToWA(), 5000);
        } else {
          console.log('Connection closed, reconnecting in 5 seconds...');
          setTimeout(() => connectToWA(), 5000);
        }
      } else if (connection === 'open') {
        console.log('✅ Bot connected successfully!');
        console.log(`👤 Logged in as: ${sock.user?.name || 'Unknown'}`);
        console.log(`📱 Phone: ${sock.user?.id || 'Unknown'}`);
        
        global.reconnectAttempts = 0;
        
        // Load commands
        loadCommands();

        // Send startup message to owner
        let startupMsg = `╭─── BUD GUYS ───⊷
┃ 🔹 Bot is active & ready!
┃ 🔹 Prefix: ${global.botConfig.prefix}
┃ 🔹 Commands: ${global.commands.size}
╰───────────⏧

> ${global.botConfig.botPower}`;

        try {
          await sock.sendMessage(sock.user.id, { 
            text: startupMsg,
            contextInfo: getContextInfo({ sender: sock.user.id })
          });
        } catch (e) {
          console.log("Could not send startup message");
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Message handler
    sock.ev.on('messages.upsert', async (update) => {
      const msg = update.messages[0];
      if (!msg.message) return;
      
      try {
        const m = sms(sock, msg);
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const isOwner = global.botConfig.ownerNumber.includes(sender.split('@')[0]);
        
        // Get message text
        let body = '';
        const type = getContentType(msg.message);
        if (type === 'conversation') body = msg.message.conversation;
        else if (type === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;
        else if (type === 'imageMessage') body = msg.message.imageMessage.caption || '';
        else if (type === 'videoMessage') body = msg.message.videoMessage.caption || '';
        
        global.msgCounter++;
        
        // Auto-view status
        if (from === 'status@broadcast') {
          await sock.readMessages([msg.key]);
        }
        
        // Handle commands
        const prefix = global.botConfig.prefix;
        const isCmd = body.startsWith(prefix);
        
        if (isCmd) {
          const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
          const args = body.trim().split(/ +/).slice(1);
          const query = args.join(' ');
          
          if (global.commands.has(command)) {
            const cmd = global.commands.get(command);
            
            // Check permission - fromMe inamaanisha owner pekee
            if (cmd.fromMe && !isOwner) {
              await sock.sendMessage(from, {
                text: `❌ This command is only for owner!`,
                contextInfo: getContextInfo({ sender })
              }, { quoted: global.fkontak });
              return;
            }
            
            // Send reaction
            await sock.sendMessage(from, {
              react: {
                text: cmd.reaction || '🤖',
                key: msg.key
              }
            });
            
            // Execute command
            try {
              await cmd.callback(from, sock, {
                ms: msg,
                m: m,
                args,
                query,
                repondre: async (text) => {
                  await sock.sendMessage(from, {
                    text: text,
                    contextInfo: getContextInfo({ sender })
                  }, { quoted: global.fkontak });
                },
                sender,
                isGroup,
                prefixe: prefix,
                nomAuteurMessage: msg.pushName || 'Unknown',
                isOwner: isOwner
              });
            } catch (e) {
              console.log(`❌ Command error: ${e.message}`);
              await sock.sendMessage(from, {
                text: `❌ Error: ${e.message}`,
                contextInfo: getContextInfo({ sender })
              }, { quoted: global.fkontak });
            }
          }
        }
      } catch (err) {
        console.error("❌ Message handler error:", err);
      }
    });

    return sock;

  } catch (err) {
    console.error("❌ Connection failed:", err);
    setTimeout(() => connectToWA(), 10000);
  }
}

// ============ EXPRESS SERVER ============
app.get("/", (req, res) => {
  res.send(`
  <html>
    <head>
      <title>BUD GUYS Bot</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: #000; color: #fff; }
        h1 { color: gold; }
        .status { color: #00ff00; }
      </style>
    </head>
    <body>
      <h1>🤖 BUD GUYS BOT</h1>
      <p>Powered by BAD GUYS HACKERS</p>
      <p class="status">✅ Bot is running!</p>
    </body>
  </html>
  `);
});

app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));

// ============ START BOT ============
connectToWA();

// Handle exit
process.on('SIGINT', () => {
  console.log('\n👋 Bot shutting down...');
  process.exit(0);
});
