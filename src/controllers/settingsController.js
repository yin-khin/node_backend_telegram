// src/controllers/settingsController.js
const { Op } = require('sequelize');
const db = require('../models');
const Setting = db.Setting;

async function getSettingsInternal() {
  const settings = await Setting.findAll();
  const result = {};

  for (const s of settings) {
    let value = s.value;
    try {
      if (s.type === 'json') value = JSON.parse(value);
      else if (s.type === 'boolean') value = value === 'true';
      else if (s.type === 'number') value = Number(value);
    } catch (e) {
      console.warn(`Failed to parse setting ${s.key}:`, e);
      // Keep original string as fallback
    }
    result[s.key] = value;
  }
  return result;
}

const getSettings = async (req, res) => {
  try {
    const data = await getSettingsInternal();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateSettings = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const input = req.body;

    // Basic backend validation
    if (typeof input.lowStockThreshold === 'number') {
      if (input.lowStockThreshold < 1 || input.lowStockThreshold > 10000) {
        throw new Error('lowStockThreshold must be between 1 and 10000');
      }
    }

    if (typeof input.criticalStockThreshold === 'number' && 
        typeof input.lowStockThreshold === 'number') {
      if (input.criticalStockThreshold >= input.lowStockThreshold) {
        throw new Error('criticalStockThreshold must be less than lowStockThreshold');
      }
    }

    const promises = [];

    for (const [key, value] of Object.entries(input)) {
      let dbValue = value;
      let type = 'string';

      if (typeof value === 'boolean') {
        type = 'boolean';
        dbValue = value.toString();
      } else if (typeof value === 'number') {
        type = 'number';
        dbValue = value.toString();
      } else if (value && typeof value === 'object') {
        type = 'json';
        dbValue = JSON.stringify(value);
      }

      promises.push(
        Setting.upsert(
          { key, value: dbValue, type },
          { transaction }
        )
      );
    }

    await Promise.all(promises);
    await transaction.commit();

    // Return fresh data to frontend
    const freshSettings = await getSettingsInternal();

    res.json({
      success: true,
      message: "Settings updated successfully",
      data: freshSettings
    });

  } catch (error) {
    await transaction.rollback();
    
    console.error('Update settings error:', error);
    
    const status = error.message.includes('must be') ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to update settings'
    });
  }
};

// Get single setting
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await Setting.findOne({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: "Setting not found"
      });
    }

    let value = setting.value;
    
    // Parse value based on type
    if (setting.type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Keep as string if parsing fails
      }
    } else if (setting.type === 'boolean') {
      value = value === 'true' || value === true;
    } else if (setting.type === 'number') {
      value = parseFloat(value);
    }

    res.json({
      success: true,
      message: "Setting retrieved successfully",
      data: {
        key: setting.key,
        value: value,
        type: setting.type
      }
    });
  } catch (error) {
    console.error("Error fetching setting:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Initialize default settings
const initializeSettings = async (req, res) => {
  try {
    const defaultSettings = [
      { key: 'siteName', value: 'Inventory Management System', type: 'string' },
      { key: 'siteDescription', value: 'ប្រព័ន្ធគ្រប់គ្រងស្តុក', type: 'string' },
      { key: 'language', value: 'km', type: 'string' },
      { key: 'timezone', value: 'Asia/Phnom_Penh', type: 'string' },
      { key: 'currency', value: 'USD', type: 'string' },
      { key: 'autoBackup', value: 'true', type: 'boolean' },
      { key: 'backupFrequency', value: 'daily', type: 'string' },
      { key: 'maxLoginAttempts', value: '5', type: 'number' },
      { key: 'sessionTimeout', value: '30', type: 'number' },
      { key: 'emailNotifications', value: 'true', type: 'boolean' },
      { key: 'systemAlerts', value: 'true', type: 'boolean' },
      { key: 'lowStockAlerts', value: 'true', type: 'boolean' },
      { key: 'lowStockThreshold', value: '10', type: 'number' },
      { key: 'theme', value: 'light', type: 'string' },
      { key: 'itemsPerPage', value: '10', type: 'number' },
      { key: 'dateFormat', value: 'DD/MM/YYYY', type: 'string' },
      { key: 'numberFormat', value: '1,234.56', type: 'string' }
    ];

    // Create settings if they don't exist
    for (const setting of defaultSettings) {
      await Setting.findOrCreate({
        where: { key: setting.key },
        defaults: setting
      });
    }

    res.json({
      success: true,
      message: "Default settings initialized successfully"
    });
  } catch (error) {
    console.error("Error initializing settings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getSetting,
  initializeSettings
};