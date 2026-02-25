const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

// Format time
const formatTime = (timezone = 'Africa/Nairobi') => {
    return moment().tz(timezone).format('DD/MM/YYYY HH:mm:ss');
};

// Get file size
const getFileSize = async (filePath) => {
    const stats = await fs.stat(filePath);
    const bytes = stats.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
};

// Download media
const downloadMedia = async (url, destPath) => {
    const writer = fs.createWriteStream(destPath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

// Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if URL is valid
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

// Extract URL from text
const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
};

// Random number
const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Capitalize first letter
const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

// Parse command and arguments
const parseCommand = (text, prefix) => {
    if (!text.startsWith(prefix)) return null;
    const args = text.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    return { command, args, query: args.join(' ') };
};

// Group admin check
const isAdmin = async (zk, groupId, userId) => {
    try {
        const groupMetadata = await zk.groupMetadata(groupId);
        const participants = groupMetadata.participants;
        const user = participants.find(p => p.id === userId);
        return user?.admin === 'admin' || user?.admin === 'superadmin';
    } catch (error) {
        return false;
    }
};

// Save settings - ILIYOREKEBISHWA
const saveSettings = async (key, value) => {
    try {
        // Hakikisha dbPath ipo
        if (!global.dbPath || !global.dbPath.settings) {
            console.error('❌ dbPath.settings is not defined!');
            return false;
        }
        
        let settings = {};
        if (await fs.pathExists(global.dbPath.settings)) {
            settings = await fs.readJSON(global.dbPath.settings);
        }
        
        if (key && value !== undefined) {
            if (key === 'groups') {
                settings.groups = value;
            } else {
                settings[key] = value;
            }
        }
        
        await fs.writeJSON(global.dbPath.settings, settings, { spaces: 2 });
        console.log(`✅ Settings saved: ${key}`);
        return true;
    } catch (error) {
        console.log('❌ Error saving settings:', error);
        return false;
    }
};

// Load settings - ILIYOREKEBISHWA
const loadSettings = async () => {
    try {
        // Hakikisha dbPath ipo
        if (!global.dbPath || !global.dbPath.settings) {
            console.error('❌ dbPath.settings is not defined!');
            return { groups: {} };
        }
        
        if (!await fs.pathExists(global.dbPath.settings)) {
            // Create default settings
            const defaultSettings = { groups: {} };
            await fs.writeJSON(global.dbPath.settings, defaultSettings, { spaces: 2 });
            return defaultSettings;
        }
        
        const settings = await fs.readJSON(global.dbPath.settings);
        return settings;
    } catch (error) {
        console.log('❌ Error loading settings:', error);
        return { groups: {} };
    }
};

module.exports = {
    formatTime,
    getFileSize,
    downloadMedia,
    sleep,
    isValidUrl,
    extractUrls,
    randomInt,
    capitalize,
    parseCommand,
    isAdmin,
    saveSettings,
    loadSettings
};