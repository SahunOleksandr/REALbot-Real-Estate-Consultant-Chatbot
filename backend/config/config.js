/**
 * Configuration management system
 * Loads and merges configuration from various sources
 */
const fs = require('fs');
const path = require('path');

// Define the environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuration object that will hold all settings
const config = {};

// Load default configuration
const defaultConfig = require('./default');
Object.assign(config, defaultConfig);

// Try to load environment-specific configuration
try {
  const envConfigPath = path.join(__dirname, `${NODE_ENV}.js`);
  if (fs.existsSync(envConfigPath)) {
    const envConfig = require(`./${NODE_ENV}.js`);
    Object.assign(config, envConfig);
    console.log(`Loaded ${NODE_ENV} configuration`);
  }
} catch (error) {
  console.log(`No specific configuration for ${NODE_ENV} environment`);
}

// Try to load local configuration (should be git-ignored)
try {
  const localConfigPath = path.join(__dirname, 'local.js');
  if (fs.existsSync(localConfigPath)) {
    const localConfig = require('./local.js.template');
    Object.assign(config, localConfig);
    console.log('Loaded local configuration overrides');
  }
} catch (error) {
  console.log('No local configuration found');
}

// Check for critical configuration values in environment variables
if (process.env.OPENAI_API_KEY) {
  config.openai = config.openai || {};
  config.openai.apiKey = process.env.OPENAI_API_KEY;
  console.log('Using OpenAI API key from environment variables');
}

if (process.env.PORT) {
  config.server = config.server || {};
  config.server.port = parseInt(process.env.PORT, 10);
}

// Validate required configuration
const validateConfig = () => {
  const missingKeys = [];
  
  // Check for required OpenAI API key
  if (!config.openai || !config.openai.apiKey) {
    missingKeys.push('openai.apiKey');
  }
  
  // If missing required keys, provide helpful error
  if (missingKeys.length > 0) {
    console.error('\n⚠️ Missing required configuration:');
    console.error(`- Missing: ${missingKeys.join(', ')}`);
    console.error('\nTo fix this, use one of the following methods:');
    console.error('1. Create a local.js file in the config directory');
    console.error('2. Set the OPENAI_API_KEY environment variable');
    console.error('3. Edit the default.js file (not recommended for sensitive data)\n');
    
    // Only throw error if this is not a test environment
    if (NODE_ENV !== 'test') {
      throw new Error(`Missing required configuration: ${missingKeys.join(', ')}`);
    }
  }
};

// Run validation
validateConfig();

// Export final configuration
module.exports = config;