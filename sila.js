/**
 * 𝙱𝚄𝙳 𝙶𝚄𝚈𝚂 - WhatsApp Bot
 * ᴾᵒʷᵉʳᵈ ᵇʸ ᴮᵃᵈ ᴳᵘʸˢ ᴴᵃᶜᵏᵉʳˢ
 */

console.clear();
console.log("📳 Starting BUD GUYS Bot...");

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

require('./config');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
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
const cfonts = require('cfonts');
const readline = require('readline');
const util = require('util');
const FileType = require('file-type');
const { File } = require('megajs');
const { fromBuffer } = require('file-type');
const bodyparser = require('body-parser');
const os = require('os');
const Crypto = require('crypto');
const express = require("express");
const ff = require('fluent-ffmpeg');

// Import custom modules
const { formatTime, sleep, parseCommand, saveSettings, loadSettings, isAdmin, getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, fetchJson } = require('./lib/functions');
const { handleWelcome, handleGoodbye, handlePromote, handleDemote, handleAntiTag, handleAntiMedia } = require('./lib/groupevents');
const { handleAntiLink } = require('./lib/antilink');
const { handleAntiDelete, AntiDelete } = require('./lib/antidel');
const { getMessageType, getMessageText, sendTyping, sendRecording, sms, downloadMediaMessage } = require('./lib/msg');
const { SettingsDB } = require('./lib/database');

// Create rl interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Global variables
global.msgCounter = 0;
global.botStartTime = Date.now();
global.settingsDB = new SettingsDB(global.dbPath.settings);
global.commands = new Map();
global.reconnectAttempts = 0;
global.maxReconnectAttempts = 10;
global.games = {};
global.conn = null; // Global connection object

// Express server
const app = express();
const port = process.env.PORT || 9090;

// Temp directory for file operations
const tempDir = path.join(os.tmpdir(), 'budguys-temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Clear temp directory every 5 minutes
const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), err => {
        if (err) throw err;
      });
    }
  });
};
setInterval(clearTempDir, 5 * 60 * 1000);

// Display banner
const showBanner = () => {
    console.clear();
    console.log(`
██████╗  ██╗   ██╗ ██████╗       ██████╗  ██╗   ██╗ ██╗   ██╗ ███████╗
██╔══██╗ ██║   ██║ ██╔══██╗     ██╔════╝  ██║   ██║ ╚██╗ ██╔╝ ██╔════╝
██████╔╝ ██║   ██║ ██║  ██║     ██║  ███╗ ██║   ██║  ╚████╔╝  ███████╗
██╔══██╗ ██║   ██║ ██║  ██║     ██║   ██║ ██║   ██║   ╚██╔╝   ╚════██║
██████╔╝ ╚██████╔╝ ██████╔╝     ╚██████╔╝ ╚██████╔╝    ██║    ███████║
╚═════╝   ╚═════╝  ╚═════╝       ╚═════╝   ╚═════╝     ╚═╝    ╚══════╝
`);
    console.log(chalk.yellow('╔════════════════════════════════════╗'));
    console.log(chalk.yellow('║    ') + chalk.red('ᴾᵒʷᵉʳᵈ ᵇʸ ᴮᵃᵈ ᴳᵘʸˢ ᴴᵃᶜᵏᵉʳˢ') + chalk.yellow('     ║'));
    console.log(chalk.yellow('╠════════════════════════════════════╣'));
    console.log(chalk.yellow('║  ') + chalk.cyan(`⏰ Time: ${formatTime()}`) + chalk.yellow('          ║'));
    console.log(chalk.yellow('║  ') + chalk.green('🚀 Starting Bot...') + chalk.yellow('              ║'));
    console.log(chalk.yellow('╚════════════════════════════════════╝'));
};

// Command registration function
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
    
    // Register aliases
    for (const a of cmdData.alias) {
        global.commands.set(a.toLowerCase(), { ...cmdData, isAlias: true });
    }
};

// Load commands from silatech folder
const loadCommands = () => {
    const silatechDir = path.join(__dirname, 'silatech');
    
    // Create silatech directory if it doesn't exist
    if (!fs.existsSync(silatechDir)) {
        fs.mkdirSync(silatechDir, { recursive: true });
    }

    const files = fs.readdirSync(silatechDir).filter(file => file.endsWith('.js'));
    console.log(chalk.cyan(`📦 Loading ${files.length} commands from silatech...`));
    
    for (const file of files) {
        try {
            require(path.join(silatechDir, file));
            console.log(chalk.green(`  ✅ Loaded: ${file}`));
        } catch (e) {
            console.error(chalk.red(`❌ Failed to load ${file}:`, e.message));
        }
    }
    
    console.log(chalk.green(`✅ Total commands: ${global.commands.size}`));
};

//===================SESSION-AUTH============================
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

// Check if session exists, if not, check for SESSION_ID in config
if (!fs.existsSync(path.join(sessionsDir, 'creds.json'))) {
  if (!global.botConfig.SESSION_ID || global.botConfig.SESSION_ID.trim() === '') {
    console.log(chalk.red('❌ Please add your session to SESSION_ID in config.js'));
    console.log(chalk.yellow('📱 You will need to scan QR code on first run'));
    // Don't exit, let it generate QR
  } else {
    const sessdata = global.botConfig.SESSION_ID.replace("sila~", '').trim();
    if (!sessdata) {
      console.log(chalk.red('❌ SESSION_ID is empty after processing'));
    } else {
      console.log(chalk.cyan('📥 Downloading session file from Mega...'));
      const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
      filer.download((err, data) => {
        if (err) {
          console.log(chalk.red('❌ Failed to download session:'), err.message);
        } else {
          fs.writeFile(path.join(sessionsDir, 'creds.json'), data, (writeErr) => {
            if (writeErr) {
              console.log(chalk.red('❌ Failed to save session:'), writeErr.message);
            } else {
              console.log(chalk.green("✅ Session downloaded successfully"));
              console.log(chalk.yellow("🔄 Restarting bot with new session..."));
              process.exit(0);
            }
          });
        }
      });
    }
  }
}

//=============================================

async function connectToWA() {
  try {
    console.log(chalk.yellow("[ ♻ ] Connecting to WhatsApp ⏳️..."));

    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      logger: Pino({ level: 'silent' }),
      printQRInTerminal: false, // QR CODE ITACHAPISHA HAPA
      browser: Browsers.macOS("Firefox"),
      syncFullHistory: true,
      auth: state,
      version
    });

    global.conn = sock; // Save to global

    // ============ ADD HELPER FUNCTIONS TO sock ============
    sock.decodeJid = jid => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (
          (decode.user &&
            decode.server &&
            decode.user + '@' + decode.server) ||
          jid
        );
      } else return jid;
    };

    sock.getName = async (jid, withoutContact = false) => {
      jid = sock.decodeJid(jid);
      withoutContact = withoutContact || false;
      
      if (jid.endsWith('@g.us')) {
        try {
          let groupMetadata = await sock.groupMetadata(jid);
          return groupMetadata.subject || 'Unknown Group';
        } catch (e) {
          return 'Unknown Group';
        }
      } else {
        let contact = sock.contacts?.[jid] || {};
        return contact.name || contact.notify || jid.split('@')[0] || 'Unknown';
      }
    };

    sock.sendContact = async (jid, numbers, quoted = '', opts = {}) => {
      let list = [];
      for (let num of numbers) {
        let cleanNum = num.replace(/[^0-9]/g, '');
        list.push({
          displayName: await sock.getName(cleanNum + '@s.whatsapp.net') || cleanNum,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${cleanNum}\nFN:${cleanNum}\nTEL;type=CELL;type=VOICE;waid=${cleanNum}:+${cleanNum}\nEND:VCARD`,
        });
      }
      await sock.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted });
    };

    sock.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
      let quoted = message.msg ? message.msg : message;
      let mime = (message.msg || message).mimetype || '';
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
      const stream = await downloadContentFromMessage(quoted, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      let type = await FileType.fromBuffer(buffer);
      let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
      await fs.writeFileSync(trueFileName, buffer);
      return trueFileName;
    };

    sock.downloadMediaMessage = async (message) => {
      let mime = (message.msg || message).mimetype || '';
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
      const stream = await downloadContentFromMessage(message, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      return buffer;
    };

    sock.sendFile = async (jid, path, fileName = '', quoted = '', options = {}) => {
      let fileBuffer = fs.readFileSync(path);
      let ext = path.split('.').pop();
      let mime = `video/${ext}`;
      
      if (/image/.test(ext)) mime = `image/${ext}`;
      if (/audio/.test(ext)) mime = `audio/${ext}`;
      
      await sock.sendMessage(jid, {
        [ext === 'mp4' ? 'video' : ext === 'mp3' ? 'audio' : 'document']: fileBuffer,
        mimetype: mime,
        fileName: fileName || path.split('/').pop(),
        ...options
      }, { quoted });
    };

    sock.sendText = (jid, text, quoted = '', options = {}) => {
      return sock.sendMessage(jid, { text: text, ...options }, { quoted });
    };

    sock.sendImage = async (jid, path, caption = '', quoted = '', options = {}) => {
      let buffer = Buffer.isBuffer(path) ? path : fs.existsSync(path) ? fs.readFileSync(path) : await getBuffer(path);
      return await sock.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
    };

    sock.sendTextWithMentions = async (jid, text, quoted = '', options = {}) => {
      let mentions = [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net');
      return sock.sendMessage(jid, { text: text, mentions: mentions, ...options }, { quoted });
    };

    sock.copyNForward = async (jid, message, forceForward = false, options = {}) => {
      let mtype = Object.keys(message.message)[0];
      let content = await generateForwardMessageContent(message, forceForward);
      let ctype = Object.keys(content)[0];
      let context = message.message[mtype].contextInfo || {};
      content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
      const waMessage = await generateWAMessageFromContent(jid, content, options);
      await sock.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
      return waMessage;
    };

    sock.cMod = (jid, copy, text = '', sender = sock.user.id, options = {}) => {
      let mtype = Object.keys(copy.message)[0];
      let isEphemeral = mtype === 'ephemeralMessage';
      if (isEphemeral) {
        mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
      }
      let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
      let content = msg[mtype];
      if (typeof content === 'string') msg[mtype] = text || content;
      else if (content.caption) content.caption = text || content.caption;
      else if (content.text) content.text = text || content.text;
      if (typeof content !== 'string') msg[mtype] = { ...content, ...options };
      copy.key.remoteJid = jid;
      copy.key.fromMe = sender === sock.user.id;
      return proto.WebMessageInfo.fromObject(copy);
    };
    // ============================================================

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(chalk.yellow('📱 Scan this QR code with WhatsApp:'));
        require('qrcode-terminal').generate(qr, { small: true });
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = DisconnectReason[statusCode] || 'Unknown';
        
        console.log(chalk.red(`❌ Connection closed: ${reason}`));
        
        if (statusCode === DisconnectReason.loggedOut) {
          console.log(chalk.red('🚫 Bot logged out, delete sessions folder and restart'));
          // Delete sessions folder
          fs.removeSync(sessionsDir);
          console.log(chalk.yellow('🔄 Restarting for new QR...'));
          setTimeout(() => connectToWA(), 5000);
        } else {
          if (global.reconnectAttempts < global.maxReconnectAttempts) {
            global.reconnectAttempts++;
            console.log(chalk.yellow(`🔄 Reconnecting... Attempt ${global.reconnectAttempts}/${global.maxReconnectAttempts}`));
            setTimeout(() => connectToWA(), 5000);
          } else {
            console.log(chalk.red('❌ Max reconnection attempts reached'));
            process.exit(1);
          }
        }
      } else if (connection === 'open') {
        console.log(chalk.green('✅ Bot connected successfully!'));
        console.log(chalk.cyan(`👤 Logged in as: ${sock.user?.name || 'Unknown'}`));
        console.log(chalk.cyan(`📱 Phone: ${sock.user?.id || 'Unknown'}`));
        
        global.reconnectAttempts = 0;

        // Load commands
        loadCommands();

        // Send startup message
        let startupMsg = `╭─── ✦  *𝙱𝚄𝙳 𝙶𝚄𝚈𝚂*  ✦ ───⊷
┃ 🔹 Your bot is now active & ready!
┃ 🔹 Enjoy smart, seamless chats
┃ 🔹 Current prefix: ${global.botConfig.prefix}
┃ 🔹 Commands loaded: ${global.commands.size}
╰───────────⏧

> ${global.botConfig.botPower}`;

        await sock.sendMessage(sock.user.id, { 
          image: { url: global.botConfig.botImage }, 
          caption: startupMsg,
          contextInfo: getContextInfo({ sender: sock.user.id })
        }, { quoted: global.fkontak });

        // Auto-follow newsletter
        try {
          await sock.newsletterFollow(global.botConfig.newsletter.autoFollow);
          console.log(chalk.green('✅ Auto-followed newsletter'));
        } catch (e) {
          console.log(chalk.red('❌ Failed to follow newsletter'));
        }

        // Auto bio update
        setInterval(async () => {
          try {
            const bioText = `⚡ ${global.botConfig.botName} | Online`;
            await sock.setStatus(bioText);
          } catch (err) {
            console.error("Failed to update Bio:", err);
          }
        }, 60000); // Update every minute
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Anti-delete handler
    sock.ev.on('messages.update', async updates => {
      for (const update of updates) {
        if (update.update.message === null) {
          console.log("Delete Detected");
          const settings = await loadSettings();
          await AntiDelete(sock, updates, settings, global.botConfig.ownerNumber[0]);
        }
      }
    });

    // Group events handler
    sock.ev.on("group-participants.update", async (update) => {
      const settings = await loadSettings();
      if (update.action === 'add') {
        for (const participant of update.participants) {
          await handleWelcome(sock, update.id, participant, sock.user.id, settings);
        }
      } else if (update.action === 'remove') {
        for (const participant of update.participants) {
          await handleGoodbye(sock, update.id, participant, sock.user.id, settings);
        }
      } else if (update.action === 'promote') {
        await handlePromote(sock, update.id, update.author, update.participants, settings);
      } else if (update.action === 'demote') {
        await handleDemote(sock, update.id, update.author, update.participants, settings);
      }
    });

    // Message handler
    sock.ev.on('messages.upsert', async (update) => {
      const msg = update.messages[0];
      if (!msg.message) return;
      
      // Ignore own messages
      if (msg.key.fromMe) return;
      
      // Handle message
      const m = sms(sock, msg);
      const type = getContentType(msg.message);
      const from = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      
      // Get message text
      let body = '';
      if (type === 'conversation') body = msg.message.conversation;
      else if (type === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;
      else if (type === 'imageMessage') body = msg.message.imageMessage.caption || '';
      else if (type === 'videoMessage') body = msg.message.videoMessage.caption || '';
      
      global.msgCounter++;
      
      // Load settings
      const settings = await loadSettings();
      
      // Auto-view status
      if (settings?.autoView && from === 'status@broadcast') {
        await sock.readMessages([msg.key]);
      }
      
      // Auto-like status
      if (settings?.autoLike && from === 'status@broadcast') {
        await sock.sendMessage(from, {
          react: {
            text: '❤️',
            key: msg.key
          }
        });
      }
      
      // Auto-typing
      if (settings?.autoTyping && !isGroup) {
        await sendTyping(sock, from, 2000);
      }
      
      // Auto-recording
      if (settings?.autoRecording && !isGroup) {
        await sendRecording(sock, from, 2000);
      }
      
      // Anti-link in groups
      if (isGroup && settings?.antiLink) {
        const isSenderAdmin = await isAdmin(sock, from, sender);
        await handleAntiLink(sock, msg, from, sender, isSenderAdmin, settings);
      }
      
      // Anti-tag in groups (silent)
      if (isGroup && settings?.groups?.[from]?.antitag) {
        const isSenderAdmin = await isAdmin(sock, from, sender);
        await handleAntiTag(sock, msg, from, sender, isSenderAdmin, settings);
      }
      
      // Anti-media in groups (silent)
      if (isGroup && settings?.groups?.[from]?.antimedia) {
        const isSenderAdmin = await isAdmin(sock, from, sender);
        await handleAntiMedia(sock, msg, from, sender, isSenderAdmin, settings);
      }
      
      // Auto-reply in DMs
      if (!isGroup && settings?.autoReply) {
        try {
          const response = await axios.get(`${global.botConfig.apis.ai}${encodeURIComponent(body)}`);
          if (response.data && response.data.data) {
            await sock.sendMessage(from, {
              text: response.data.data,
              contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
          }
        } catch (e) {
          console.log('AI error:', e);
        }
      }
      
      // Auto-react feature
      try {
        const featuresPath = path.join(__dirname, 'data', 'features.json');
        if (fs.existsSync(featuresPath)) {
          const features = fs.readJSONSync(featuresPath);
          if (features.AUTOREACT_STATUS === 'yes' && !msg.key.fromMe) {
            const reactionEmojis = ['👍', '❤️', '🔥', '🥰', '👏', '😁', '🎉', '🤩', '👌', '💯', '🤣', '😍', '✨', '🌟', '⭐', '✅', '💪', '🙏', '⚡', '💫'];
            const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
            
            await sock.sendMessage(from, {
              react: {
                text: randomEmoji,
                key: msg.key
              }
            });
          }
        }
      } catch (e) {
        console.log('Auto-react error:', e);
      }
      
      // Handle commands
      const prefix = settings?.prefix || global.botConfig.prefix;
      const isCmd = body.startsWith(prefix);
      
      if (isCmd) {
        const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
        const args = body.trim().split(/ +/).slice(1);
        const query = args.join(' ');
        
        // Check if command exists
        if (global.commands.has(command)) {
          const cmd = global.commands.get(command);
          
          // Check permission
          if (cmd.fromMe && sender !== global.botConfig.ownerNumber[0] + '@s.whatsapp.net') {
            await sock.sendMessage(from, {
              text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ This command is only for owner!
╰───────────⏧

> ${global.botConfig.botPower}`,
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
              isOwner: sender === global.botConfig.ownerNumber[0] + '@s.whatsapp.net'
            });
          } catch (e) {
            console.log(chalk.red(`❌ Command error: ${e.message}`));
            await sock.sendMessage(from, {
              text: `╭─── ✦  *𝙴𝚁𝚁𝙾𝚁*  ✦ ───⊷
┃ ❌ Error: ${e.message}
╰───────────⏧

> ${global.botConfig.botPower}`,
              contextInfo: getContextInfo({ sender })
            }, { quoted: global.fkontak });
          }
        }
      }
    });

    return sock;

  } catch (err) {
    console.error("[ ❌ ] Connection failed:", err);
    setTimeout(() => connectToWA(), 10000);
  }
}

// Express server
app.get("/", (req, res) => {
  res.send(`
  <html>
    <head>
      <title>BUD GUYS Bot</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        h1 { font-size: 3em; }
      </style>
    </head>
    <body>
      <h1>🤖 BUD GUYS BOT</h1>
      <p>Powered by BAD GUYS HACKERS</p>
      <p>Bot is running! ✅</p>
      <p>Time: ${formatTime()}</p>
    </body>
  </html>
  `);
});

app.listen(port, '0.0.0.0', () => console.log(chalk.green(`✅ Server listening on port http://0.0.0.0:${port}`)));

// Start bot
const start = async () => {
  showBanner();
  setTimeout(() => {
    connectToWA();
  }, 2000);
};

start();

// Handle exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n👋 Bot shutting down...'));
  process.exit(0);
});