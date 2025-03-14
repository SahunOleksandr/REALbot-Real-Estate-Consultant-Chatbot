const openaiService = require('../services/openaiService');
const fs = require('fs');
const path = require('path');

// Initialize in-memory session storage
// For a production app, use a proper database
const sessions = {};

// Analytics file path
const analyticsFilePath = path.join(__dirname, '../data/analytics.json');

// Update analytics data
const updateAnalytics = (userQuestion) => {
  try {
    // Load current analytics
    const analyticsData = JSON.parse(fs.readFileSync(analyticsFilePath, 'utf8'));
    
    // Normalize question for categorization (remove punctuation, lowercase)
    const normalizedQuestion = userQuestion.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Extract keywords (words with 4+ characters)
    const keywords = normalizedQuestion.split(' ')
      .filter(word => word.length >= 4);
    
    // Update question counts
    keywords.forEach(keyword => {
      if (!analyticsData.questionCounts[keyword]) {
        analyticsData.questionCounts[keyword] = 0;
      }
      analyticsData.questionCounts[keyword]++;
    });
    
    // Add timestamp to conversation stats
    analyticsData.conversationStats.push({
      timestamp: new Date().toISOString(),
      question: userQuestion.substring(0, 100) // Truncate long questions
    });
    
    // Keep only the most recent 1000 conversations
    if (analyticsData.conversationStats.length > 1000) {
      analyticsData.conversationStats = analyticsData.conversationStats.slice(-1000);
    }
    
    // Save updated analytics
    fs.writeFileSync(analyticsFilePath, JSON.stringify(analyticsData, null, 2));
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
};

const chatController = {
  // Initialize or get a chat session
  getSession: (req, res) => {
    const { sessionId } = req.params;
    
    // Create new session if it doesn't exist
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        id: sessionId,
        messages: [],
        userData: {
          budget: null,
          preferredLocation: null,
          propertyType: null,
          timeline: null,
          readyToContact: false,
          contactInfo: null
        },
        createdAt: new Date().toISOString()
      };
    }
    
    res.json({ 
      sessionId: sessionId,
      userData: sessions[sessionId].userData
    });
  },
  
  // Send a message in the chat
  sendMessage: async (req, res) => {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    // Check if session exists
    if (!sessions[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    try {
      // Add user message to session
      sessions[sessionId].messages.push({
        role: 'user',
        content: message
      });
      
      // Update analytics
      updateAnalytics(message);
      
      // Check knowledge base for direct match first
      const directAnswer = openaiService.findRelevantAnswer(message);
      
      let responseData;
      
      if (directAnswer) {
        // Use direct answer from knowledge base
        responseData = {
          message: directAnswer,
          sessionData: sessions[sessionId].userData
        };
        
        // Add assistant message to session
        sessions[sessionId].messages.push({
          role: 'assistant',
          content: directAnswer
        });
      } else {
        // No direct match, use OpenAI to generate response
        responseData = await openaiService.generateChatResponse(
          sessions[sessionId].messages,
          sessions[sessionId].userData
        );
        
        // Update session with AI response and user data
        sessions[sessionId].messages.push({
          role: 'assistant',
          content: responseData.message
        });
        
        sessions[sessionId].userData = responseData.sessionData;
      }
      
      // Trim conversation history if it gets too long
      if (sessions[sessionId].messages.length > 20) {
        const systemMessage = sessions[sessionId].messages[0];
        sessions[sessionId].messages = [
          systemMessage,
          ...sessions[sessionId].messages.slice(-19)
        ];
      }
      
      res.json({
        message: responseData.message,
        userData: sessions[sessionId].userData
      });
    } catch (error) {
      console.error('Error in chat controller:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  },
  
  // Update user contact information
  updateContactInfo: (req, res) => {
    const { sessionId } = req.params;
    const { name, phone, email, bestTime } = req.body;
    
    // Check if session exists
    if (!sessions[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Update contact information
    sessions[sessionId].userData.contactInfo = {
      name,
      phone,
      email,
      bestTime,
      submittedAt: new Date().toISOString()
    };
    
    res.json({ 
      success: true,
      userData: sessions[sessionId].userData
    });
  },
  
  // Get conversation history
  getConversation: (req, res) => {
    const { sessionId } = req.params;
    
    // Check if session exists
    if (!sessions[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Return only user and assistant messages (not system messages)
    const conversationHistory = sessions[sessionId].messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
    
    res.json({
      sessionId,
      conversation: conversationHistory,
      userData: sessions[sessionId].userData
    });
  }
};

module.exports = chatController;