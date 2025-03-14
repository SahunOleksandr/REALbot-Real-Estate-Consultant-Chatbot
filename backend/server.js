/**
 * REALbot Server
 * This is the main entry point for the REALbot application.
 */

// Import required packages
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config/config');
const chatRoutes = require('./routes/chat');
const apiRoutes = require('./routes/api');

// Log configuration status
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('OpenAI API Key:', config.openai.apiKey ? 'Configured ✓' : 'Missing ✗');

// Create Express app
const app = express();
const PORT = config.server.port || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Create analytics.json if it doesn't exist
const analyticsFile = path.join(dataDir, 'analytics.json');
if (!fs.existsSync(analyticsFile)) {
  fs.writeFileSync(analyticsFile, JSON.stringify({ questionCounts: {}, conversationStats: [] }));
}

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api', apiRoutes);

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`REALbot server running on port ${PORT}`);
});

module.exports = app;