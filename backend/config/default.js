/**
 * Default configuration values
 * These are the base settings that can be overridden by environment-specific configs
 */
module.exports = {
    server: {
      port: 3000,
      host: 'localhost'
    },
    openai: {
      // API key should NOT be set here - use environment variables or local.js
      apiKey: null,
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 500
    },
    logging: {
      level: 'info',
      format: 'dev'
    },
    analytics: {
      enabled: true,
      maxConversations: 1000
    }
  };