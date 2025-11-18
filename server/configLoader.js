const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

let config = null;
let configPath = path.join(__dirname, 'config.yaml');

function loadConfig() {
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    config = yaml.load(fileContents);
    console.log('Configuration loaded successfully');
    return config;
  } catch (e) {
    console.error('Error loading configuration:', e);
    throw e;
  }
}

function getConfig() {
  if (!config) {
    loadConfig();
  }
  return config;
}

function getResource(resourceId) {
  const cfg = getConfig();
  return cfg.resources.find(r => r.id === resourceId);
}

function getAllResources() {
  const cfg = getConfig();
  return cfg.resources || [];
}

function getWorkingHours(resourceId, dayName) {
  const resource = getResource(resourceId);
  const cfg = getConfig();

  // Check if resource has custom working hours
  if (resource && resource.workingHours && resource.workingHours[dayName]) {
    return resource.workingHours[dayName];
  }

  // Fall back to global working hours
  return cfg.workingHours[dayName];
}

function getSlotDuration(resourceId) {
  const resource = getResource(resourceId);
  if (resource && resource.slotDuration) {
    return resource.slotDuration;
  }
  return getConfig().defaults.slotDuration;
}

function getBusinessInfo() {
  return getConfig().business;
}

function getAppInfo() {
  return getConfig().app;
}

function getEmbedSettings() {
  return getConfig().embed;
}

function getDefaults() {
  return getConfig().defaults;
}

// Watch for config file changes and reload
function watchConfig() {
  fs.watch(configPath, (eventType) => {
    if (eventType === 'change') {
      console.log('Configuration file changed, reloading...');
      loadConfig();
    }
  });
}

// Validate configuration on load
function validateConfig() {
  const cfg = getConfig();

  if (!cfg.resources || cfg.resources.length === 0) {
    throw new Error('No resources defined in configuration');
  }

  if (!cfg.workingHours) {
    throw new Error('Working hours not defined in configuration');
  }

  // Check for duplicate resource IDs
  const ids = cfg.resources.map(r => r.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate resource IDs found: ${duplicates.join(', ')}`);
  }

  return true;
}

module.exports = {
  loadConfig,
  getConfig,
  getResource,
  getAllResources,
  getWorkingHours,
  getSlotDuration,
  getBusinessInfo,
  getAppInfo,
  getEmbedSettings,
  getDefaults,
  watchConfig,
  validateConfig
};
