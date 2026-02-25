const fs = require('fs-extra');
const path = require('path');

// Simple JSON database
class Database {
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.data = {};
        this.load();
    }

    // Load database
    load() {
        try {
            if (fs.existsSync(this.dbPath)) {
                this.data = fs.readJSONSync(this.dbPath);
            } else {
                this.data = {};
                this.save();
            }
        } catch (error) {
            console.log('Error loading database:', error);
            this.data = {};
        }
    }

    // Save database
    save() {
        try {
            fs.ensureDirSync(path.dirname(this.dbPath));
            fs.writeJSONSync(this.dbPath, this.data, { spaces: 2 });
            return true;
        } catch (error) {
            console.log('Error saving database:', error);
            return false;
        }
    }

    // Get value
    get(key, defaultValue = null) {
        return this.data[key] !== undefined ? this.data[key] : defaultValue;
    }

    // Set value
    set(key, value) {
        this.data[key] = value;
        this.save();
        return true;
    }

    // Delete key
    delete(key) {
        if (this.data[key] !== undefined) {
            delete this.data[key];
            this.save();
            return true;
        }
        return false;
    }

    // Check if key exists
    has(key) {
        return this.data[key] !== undefined;
    }

    // Get all data
    all() {
        return this.data;
    }

    // Clear database
    clear() {
        this.data = {};
        this.save();
        return true;
    }
}

// Settings database
class SettingsDB extends Database {
    constructor(dbPath) {
        super(dbPath);
    }

    // Get feature status
    getFeature(feature, defaultValue = false) {
        return this.get(feature, defaultValue);
    }

    // Set feature status
    setFeature(feature, value) {
        return this.set(feature, value);
    }

    // Toggle feature
    toggleFeature(feature) {
        const current = this.getFeature(feature, false);
        this.setFeature(feature, !current);
        return !current;
    }

    // Get prefix
    getPrefix(defaultPrefix = '.') {
        return this.get('prefix', defaultPrefix);
    }

    // Set prefix
    setPrefix(prefix) {
        return this.set('prefix', prefix);
    }

    // Get group settings
    getGroup(groupId) {
        const groups = this.get('groups', {});
        return groups[groupId] || {};
    }

    // Set group settings
    setGroup(groupId, settings) {
        const groups = this.get('groups', {});
        groups[groupId] = { ...groups[groupId], ...settings };
        return this.set('groups', groups);
    }
}

module.exports = {
    Database,
    SettingsDB
};