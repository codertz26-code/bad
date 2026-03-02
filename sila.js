console.clear()
console.log("📳 Starting SILA-MD...")

// ============ GLOBAL ANTI-CRASH ============
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
})
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason)
})

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
} = require('@whiskeysockets/baileys')

const l = console.log
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, 
        fkontak, getContextInfo, sendButtonMessage, sendTemplateButton, sendListMessage, createButtons } = require('./lib/functions')
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
const fs = require('fs')
const ff = require('fluent-ffmpeg')
const P = require('pino')
const config = require('./config')
const GroupEvents = require('./lib/groupevents')
const util = require('util')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const FileType = require('file-type')
const axios = require('axios')
const { File } = require('megajs')
const { fromBuffer } = require('file-type')
const bodyparser = require('body-parser')
const os = require('os')
const Crypto = require('crypto')
const path = require('path')
const prefix = config.PREFIX

// ============ OWNER CONFIGURATION ============
const ownerNumber = ['255768978061'] // Namba yako
const ownerNumberFormatted = ownerNumber.map(num => num.includes('@s.whatsapp.net') ? num : num + '@s.whatsapp.net')

const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) throw err
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), err => {
        if (err) throw err
      })
    }
  })
}

setInterval(clearTempDir, 5 * 60 * 1000)

//=================== SESSION HANDLING - FIXED ============================
// Create sessions directory if it doesn't exist
if (!fs.existsSync(__dirname + '/sessions')) {
  fs.mkdirSync(__dirname + '/sessions', { recursive: true })
}

// Check for session
async function checkAndDownloadSession() {
  return new Promise(async (resolve, reject) => {
    // If session exists, resolve immediately
    if (fs.existsSync(__dirname + '/sessions/creds.json')) {
      console.log('✅ Session file found')
      return resolve(true)
    }

    // If no SESSION_ID in config
    if (!config.SESSION_ID || config.SESSION_ID.trim() === '') {
      console.log('❌ No SESSION_ID found. Please add your session to config.env or config.js')
      return reject(new Error('No SESSION_ID'))
    }

    // Process session ID
    let sessdata = config.SESSION_ID
    if (sessdata.includes('sila~')) {
      sessdata = sessdata.replace("sila~", '').trim()
    }
    
    if (!sessdata) {
      console.log('❌ SESSION_ID is empty after processing')
      return reject(new Error('Empty SESSION_ID'))
    }

    console.log('📥 Downloading session file from Mega...')
    
    try {
      const fileUrl = `https://mega.nz/file/${sessdata}`
      console.log(`Downloading from: ${fileUrl}`)
      
      const filer = File.fromURL(fileUrl)
      
      filer.download((err, data) => {
        if (err) {
          console.log('❌ Failed to download session:', err.message)
          return reject(err)
        }
        
        fs.writeFile(__dirname + '/sessions/creds.json', data, (writeErr) => {
          if (writeErr) {
            console.log('❌ Failed to save session:', writeErr.message)
            return reject(writeErr)
          }
          console.log("✅ Session downloaded successfully")
          console.log("🔄 Restarting bot with new session...")
          // Small delay before restart
          setTimeout(() => {
            process.exit(0)
          }, 2000)
        })
      })
    } catch (error) {
      console.log('❌ Download error:', error.message)
      reject(error)
    }
  })
}

const express = require("express")
const app = express()
const port = process.env.PORT || 9090

let conn

//=============================================

async function connectToWA() {
  try {
    console.log("[ ♻ ] Connecting to WhatsApp ⏳️...")

    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/')
    const { version } = await fetchLatestBaileysVersion()

    conn = makeWASocket({
      logger: P({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.macOS("Firefox"),
      syncFullHistory: true,
      auth: state,
      version
    })

    // Helper functions
    conn.sendButton = async (jid, text, buttons, footer = '', options = {}) => {
      return await sendButtonMessage(conn, jid, text, buttons, footer, options);
    };
    
    conn.sendTemplateButton = async (jid, text, footer, buttons, options = {}) => {
      return await sendTemplateButton(conn, jid, text, footer, buttons, options);
    };
    
    conn.sendList = async (jid, text, footer, title, buttonText, sections, options = {}) => {
      return await sendListMessage(conn, jid, text, footer, title, buttonText, sections, options);
    };
    
    conn.fkontak = fkontak;
    conn.getContextInfo = (m, ownerName = config.OWNER_NAME || 'Owner', ownerNumber = config.OWNER_NUMBER || '255*********') => {
      return getContextInfo(m, ownerName, ownerNumber);
    };
    
    conn.createButtons = (buttons) => {
      return createButtons(buttons);
    };

    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        console.log('[ ⚠️ ] Connection closed:', lastDisconnect?.error?.output?.statusCode)
        
        if (shouldReconnect) {
          console.log('[ ♻️ ] Attempting to reconnect...')
          setTimeout(() => connectToWA(), 5000)
        } else {
          console.log('[ ❌ ] Logged out. Please update your SESSION_ID')
        }
      } else if (connection === 'open') {
        try {
          console.log('[ ❤️ ] Installing Plugins')

          // Load plugins
          if (fs.existsSync("./plugins/")) {
            fs.readdirSync("./plugins/").forEach((plugin) => {
              if (path.extname(plugin).toLowerCase() === ".js") {
                try {
                  require("./plugins/" + plugin)
                  console.log(`✅ Loaded plugin: ${plugin}`)
                } catch (e) {
                  console.log(`❌ Failed to load plugin ${plugin}:`, e.message)
                }
              }
            })
          }

          console.log('[ ✔ ] Plugins installed successfully ✅')
          console.log('[ 🪀 ] Bot connected to WhatsApp 📲')
          console.log(`[ 👤 ] Bot Number: ${conn.user.id.split(':')[0]}`)
          console.log(`[ 👑 ] Owner Numbers: ${ownerNumber.join(', ')}`)

          let up = `┏━❑ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐒𝐈𝐋𝐀-𝐌𝐃 ━━━━━━━━━━━
┃ 🔹 Your bot is now active & ready!
┃ 🔹 Enjoy smart, seamless chats
┃ 🔹 Current prefix: .
┗━━━━━━━━━━━━━━━━━
┏━❑ SUPPORT PROJECT ━━━━━━━━━
┃ ⭐ Star | 🔄 Fork | 📢 Share
┃ 🔗 GitHub: https://github.com/Sila-Md/SILA-MD
┗━━━━━━━━━━━━━━━━━━━━━━━━

> © 𝐒𝐈𝐋𝐀 𝐌𝐃 | Crafted with precision`;
    
          try {
            await conn.sendMessage(conn.user.id, { 
              image: { url: `https://files.catbox.moe/36vahk.png` }, 
              caption: up 
            })
          } catch (e) {
            console.log("Could not send welcome image, sending text only")
            await conn.sendMessage(conn.user.id, { text: up })
          }

          const channelJid = "120363402325089913@newsletter"
          try {
            await conn.newsletterFollow(channelJid)
            console.log(`Successfully followed channel: ${channelJid}`)
          } catch (error) {
            console.error(`Failed to follow channel: ${error}`)
          }

        } catch (error) {
          console.error("[ ❌ ] Error during post-connect setup:", error)
        }
      }
    })

    conn.ev.on('creds.update', saveCreds)

  } catch (err) {
    console.error("[ ❌ ] Connection failed:", err)
  }
  
  // Auto Bio Update
  function getCurrentDateTimeParts() {
    const options = {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
    const formatter = new Intl.DateTimeFormat('en-KE', options);
    const parts = formatter.formatToParts(new Date());

    let date = '', time = '';

    parts.forEach(part => {
        if (part.type === 'day' || part.type === 'month' || part.type === 'year') {
            date += part.value;
            if (part.type !== 'year') date += '/';
        }
        if (part.type === 'hour' || part.type === 'minute' || part.type === 'second') {
            time += part.value;
            if (part.type !== 'second') time += ':';
        }
    });

    return { date, time };
  }

  setInterval(async () => {
    if (config.AUTO_BIO === "true") {
        const { date, time } = getCurrentDateTimeParts();
        const bioText = `𝚈𝚘𝚞𝚛 𝚋𝚘𝚝 𝚒𝚜 𝚗𝚘𝚠 𝚊𝚌𝚝𝚒𝚟𝚎 & 𝚛𝚎𝚊𝚍𝚢`;
        try {
            await conn.setStatus(bioText);
            console.log(`Updated Bio: ${bioText}`);
        } catch (err) {
            console.error("Failed to update Bio:", err);
        }
    }
  }, 60000);
  
  // Anti Delete
  conn?.ev?.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null) {
        console.log("Delete Detected")
        await AntiDelete(conn, updates)
      }
    }
  });
  
  // Group Events
  conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update));	  
	  
  // Messages Handler
  conn.ev.on('messages.upsert', async(mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
    ? mek.message.ephemeralMessage.message 
    : mek.message;
    
    if (config.READ_MESSAGE === 'true') {
      await conn.readMessages([mek.key]);
    }
    
    if(mek.message.viewOnceMessageV2)
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
    
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true"){
      await conn.readMessages([mek.key])
    }
    
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true"){
      const ravlike = await conn.decodeJid(conn.user.id);
      const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '🖤', '💚'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      await conn.sendMessage(mek.key.remoteJid, {
        react: {
          text: randomEmoji,
          key: mek.key,
        } 
      }, { statusJidList: [mek.key.participant, ravlike] });
    }                       
    
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true"){
      const user = mek.key.participant
      const text = `${config.AUTO_STATUS_MSG}`
      await conn.sendMessage(user, { text: text }, { quoted: mek })
    }
    
    await Promise.all([
      saveMessage(mek),
    ]);
    
    const m = sms(conn, mek)
    const type = getContentType(mek.message)
    const from = mek.key.remoteJid
    const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
    const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
    const isCmd = body.startsWith(prefix)
    var budy = typeof mek.text == 'string' ? mek.text : false;
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1)
    const q = args.join(' ')
    const text = args.join(' ')
    const isGroup = from.endsWith('@g.us')
    const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
    const senderNumber = sender.split('@')[0]
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net'
    const botNumberClean = conn.user.id.split(':')[0]
    const pushname = mek.pushName || 'User'
    const isMe = botNumber.includes(senderNumber)
    
    // OWNER CHECK - FIXED
    const isOwner = ownerNumber.includes(senderNumber) || ownerNumberFormatted.includes(sender) || isMe
    
    const botNumber2 = await jidNormalizedUser(conn.user.id);
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => null) : null
    const groupName = isGroup && groupMetadata ? groupMetadata.subject : ''
    const participants = isGroup && groupMetadata ? groupMetadata.participants : ''
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
    
    // ADMIN CHECK - FIXED
    const isAdmins = isGroup ? groupAdmins.some(admin => {
      const adminClean = admin.split('@')[0]
      return adminClean === senderNumber || admin === sender || admin === sender.split('@')[0] + '@s.whatsapp.net'
    }) : false
    
    const isReact = m.message.reactionMessage ? true : false
    
    const reply = (teks) => {
      conn.sendMessage(from, { text: teks }, { quoted: mek })
    }
    
    const udp = botNumberClean;
    const rav = ['255789661031', '255768978061'];
    let isCreator = [udp, ...rav, config.DEV]
          .map(v => v && v.replace ? v.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
          .filter(v => v)
          .includes(sender);

    // MODE CHECK - FIXED
    let shouldProcess = true;
    
    if (config.MODE === "private") {
      shouldProcess = isOwner;
    } else if (config.MODE === "inbox") {
      shouldProcess = !isGroup || isOwner;
    } else if (config.MODE === "groups") {
      shouldProcess = isGroup || isOwner;
    }
    
    if (!shouldProcess && !isCmd) return;
    
    // Commands handling
    const events = require('./command')
    const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
    
    if (isCmd) {
      const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
      if (cmd) {
        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
        
        try {
          cmd.function(conn, mek, m,{
            from, quoted, body, isCmd, command, args, q, text, 
            isGroup, sender, senderNumber, botNumber2, botNumber, 
            pushname, isMe, isOwner, isCreator, groupMetadata, 
            groupName, participants, groupAdmins, isBotAdmins, 
            isAdmins, reply
          });
        } catch (e) {
          console.error("[PLUGIN ERROR] " + e);
        }
      }
    }
    
    // Event handlers for on: 'body', 'image', etc.
    if (events && events.commands) {
      events.commands.map(async(command) => {
        if (command.on) {
          if (body && command.on === "body") {
            command.function(conn, mek, m,{
              from, l, quoted, body, isCmd, command, args, q, text, 
              isGroup, sender, senderNumber, botNumber2, botNumber, 
              pushname, isMe, isOwner, isCreator, groupMetadata, 
              groupName, participants, groupAdmins, isBotAdmins, 
              isAdmins, reply
            })
          } else if (mek.q && command.on === "text") {
            command.function(conn, mek, m,{
              from, l, quoted, body, isCmd, command, args, q, text, 
              isGroup, sender, senderNumber, botNumber2, botNumber, 
              pushname, isMe, isOwner, isCreator, groupMetadata, 
              groupName, participants, groupAdmins, isBotAdmins, 
              isAdmins, reply
            })
          } else if (
            (command.on === "image" || command.on === "photo") &&
            mek.type === "imageMessage"
          ) {
            command.function(conn, mek, m,{
              from, l, quoted, body, isCmd, command, args, q, text, 
              isGroup, sender, senderNumber, botNumber2, botNumber, 
              pushname, isMe, isOwner, isCreator, groupMetadata, 
              groupName, participants, groupAdmins, isBotAdmins, 
              isAdmins, reply
            })
          } else if (
            command.on === "sticker" &&
            mek.type === "stickerMessage"
          ) {
            command.function(conn, mek, m,{
              from, l, quoted, body, isCmd, command, args, q, text, 
              isGroup, sender, senderNumber, botNumber2, botNumber, 
              pushname, isMe, isOwner, isCreator, groupMetadata, 
              groupName, participants, groupAdmins, isBotAdmins, 
              isAdmins, reply
            })
          }
        }
      });
    }
  
  });
  
  // Helper functions
  conn.decodeJid = jid => {
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
  
  conn.copyNForward = async(jid, message, forceForward = false, options = {}) => {
    let vtype
    if (options.readViewOnce) {
        message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
        vtype = Object.keys(message.message.viewOnceMessage.message)[0]
        delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
        delete message.message.viewOnceMessage.message[vtype].viewOnce
        message.message = {
            ...message.message.viewOnceMessage.message
        }
    }
    
    let mtype = Object.keys(message.message)[0]
    let content = await generateForwardMessageContent(message, forceForward)
    let ctype = Object.keys(content)[0]
    let context = {}
    if (mtype != "conversation") context = message.message[mtype].contextInfo
    content[ctype].contextInfo = {
        ...context,
        ...content[ctype].contextInfo
    }
    const waMessage = await generateWAMessageFromContent(jid, content, options ? {
        ...content[ctype],
        ...options,
        ...(options.contextInfo ? {
            contextInfo: {
                ...content[ctype].contextInfo,
                ...options.contextInfo
            }
        } : {})
    } : {})
    await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
    return waMessage
  }
  
  conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(quoted, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    let type = await FileType.fromBuffer(buffer)
    trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
    await fs.writeFileSync(trueFileName, buffer)
    return trueFileName
  }
  
  conn.downloadMediaMessage = async(message) => {
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
  }
  
  conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    try {
      let mime = '';
      let res = await axios.head(url)
      mime = res.headers['content-type']
      if (mime.split("/")[1] === "gif") {
        return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
      }
      if (mime === "application/pdf") {
        return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
      }
      if (mime.split("/")[0] === "image") {
        return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
      }
      if (mime.split("/")[0] === "video") {
        return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
      }
      if (mime.split("/")[0] === "audio") {
        return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
      }
    } catch (e) {
      console.log("Error in sendFileUrl:", e)
    }
  }
  
  conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })
  
  conn.sendImage = async(jid, path, caption = '', quoted = '', options) => {
    let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
    return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
  }
  
  conn.serializeM = mek => sms(conn, mek, store);
}

// ============ STARTUP SEQUENCE ============
app.get("/", (req, res) => {
  res.send("SILA-MD STARTED ✅");
});

app.listen(port, '0.0.0.0', () => console.log(`Server listening on port http://0.0.0.0:${port}`));

// Start bot after checking session
async function startBot() {
  try {
    await checkAndDownloadSession()
    // Small delay before connecting
    setTimeout(() => {
      connectToWA()
    }, 2000)
  } catch (error) {
    console.log("❌ Failed to setup session:", error.message)
    console.log("💡 Please check your SESSION_ID in config.env or config.js")
    // Still try to connect (maybe QR code will be shown)
    setTimeout(() => {
      connectToWA()
    }, 2000)
  }
}

// Start the bot
startBot()
