const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Analytics file path
const analyticsFilePath = path.join(__dirname, '../data/analytics.json');

// Get analytics data
router.get('/analytics', (req, res) => {
  try {
    // Read analytics file
    const analyticsData = JSON.parse(fs.readFileSync(analyticsFilePath, 'utf8'));
    
    // Sort keywords by frequency
    const sortedKeywords = Object.entries(analyticsData.questionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Get top 20 keywords
    
    // Count conversations by day
    const conversationsByDay = {};
    analyticsData.conversationStats.forEach(stat => {
      const date = stat.timestamp.split('T')[0];
      conversationsByDay[date] = (conversationsByDay[date] || 0) + 1;
    });
    
    // Format response
    const response = {
      topKeywords: sortedKeywords.map(([keyword, count]) => ({ keyword, count })),
      conversationsByDay: Object.entries(conversationsByDay).map(([date, count]) => ({ date, count })),
      totalConversations: analyticsData.conversationStats.length
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error retrieving analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics data' });
  }
});

// Get knowledge base
router.get('/knowledge', (req, res) => {
  try {
    const knowledgeBasePath = path.join(__dirname, '../data/knowledgeBase.json');
    const knowledgeBase = JSON.parse(fs.readFileSync(knowledgeBasePath, 'utf8'));
    res.json(knowledgeBase);
  } catch (error) {
    console.error('Error retrieving knowledge base:', error);
    res.status(500).json({ error: 'Failed to retrieve knowledge base' });
  }
});

// Update knowledge base
router.post('/knowledge', (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Invalid knowledge base format' });
    }
    
    const knowledgeBasePath = path.join(__dirname, '../data/knowledgeBase.json');
    const knowledgeBase = { questions };
    
    fs.writeFileSync(knowledgeBasePath, JSON.stringify(knowledgeBase, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    res.status(500).json({ error: 'Failed to update knowledge base' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;