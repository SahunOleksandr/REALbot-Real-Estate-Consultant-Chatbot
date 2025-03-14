const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Initialize or get chat session
router.get('/session/:sessionId', chatController.getSession);

// Send message to chatbot
router.post('/session/:sessionId/message', chatController.sendMessage);

// Update user contact information
router.post('/session/:sessionId/contact', chatController.updateContactInfo);

// Get conversation history
router.get('/session/:sessionId/conversation', chatController.getConversation);

module.exports = router;