const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Initialize OpenAI client
let openai;

try {
  // Create the OpenAI client with config
  openai = new OpenAI({
    apiKey: config.openai.apiKey
  });
  
  console.log('✅ OpenAI service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize OpenAI client:', error.message);
  throw error; // Re-throw to prevent the application from running without API access
}

// Load knowledge base
const knowledgeBasePath = path.join(__dirname, '../data/knowledgeBase.json');
const knowledgeBase = JSON.parse(fs.readFileSync(knowledgeBasePath, 'utf8'));

// Service for handling OpenAI interactions
const openaiService = {
  // Generate system prompt with knowledge base
  generateSystemPrompt: () => {
    const questionData = knowledgeBase.questions.map(q => 
      `Question: ${q.question}\nAnswer: ${q.answer}`
    ).join('\n\n');

    return `You are REALbot, an AI assistant for Elite Properties Group, a real estate company.
Your goal is to help potential homebuyers by answering their questions about real estate.
Always be helpful, professional, and concise.

If a user asks about specific properties or neighborhoods that aren't in your knowledge base,
suggest they speak with a real estate agent for personalized recommendations.

If a user expresses interest in viewing a property or speaking with an agent,
ask for their name, phone number, and best time to contact them.

Try to identify the user's budget, preferred locations, property type, and timeline when appropriate.

Here's a knowledge base of common questions and answers to reference:

${questionData}`;
  },

  // Generate chat completion using OpenAI API
  generateChatResponse: async (messages, sessionData) => {
    try {
      // Add system message if it's not already in the messages
      if (!messages.some(msg => msg.role === 'system')) {
        messages.unshift({
          role: 'system',
          content: openaiService.generateSystemPrompt()
        });
      }

      // Get response from OpenAI
      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: messages,
        temperature: config.openai.temperature,
        max_tokens: config.openai.maxTokens
      });

      // Extract and process AI response
      const aiMessage = response.choices[0].message.content;
      
      // Check if response includes user qualification details
      const budgetMatch = aiMessage.match(/budget.*?(\$[\d,]+|\d+k|\d+ thousand|\d+ million)/i);
      const locationMatch = aiMessage.match(/location[s]?.*?([A-Za-z\s,]+)/i);
      const timelineMatch = aiMessage.match(/timeline.*?(\d+\s+(?:days|weeks|months|years))/i);
      
      // Update session data if qualification details found
      if (budgetMatch && !sessionData.budget) {
        sessionData.budget = budgetMatch[1];
      }
      if (locationMatch && !sessionData.preferredLocation) {
        sessionData.preferredLocation = locationMatch[1].trim();
      }
      if (timelineMatch && !sessionData.timeline) {
        sessionData.timeline = timelineMatch[1];
      }
      
      // Check if user is ready to speak with an agent
      const readyToViewMatch = aiMessage.match(/viewing|tour|show|see the (house|property|home)|speak with an agent/i);
      if (readyToViewMatch) {
        sessionData.readyToContact = true;
      }

      return {
        message: aiMessage,
        sessionData: sessionData
      };
    } catch (error) {
      console.error('Error generating chat response:', error);
      return {
        message: "I'm sorry, I'm having trouble connecting to my knowledge base. Please try again in a moment.",
        sessionData: sessionData
      };
    }
  },

  // Match user question with knowledge base
  findRelevantAnswer: (userQuestion) => {
    // Simple matching function - could be improved with embeddings or more sophisticated NLP
    const question = userQuestion.toLowerCase();
    
    for (const entry of knowledgeBase.questions) {
      // Check if question contains keywords from the knowledge base question
      const keywords = entry.question.toLowerCase().split(' ')
        .filter(word => word.length > 3) // Only use significant words
        .map(word => word.replace(/[^a-z0-9]/g, '')); // Remove punctuation
        
      const matchCount = keywords.filter(word => question.includes(word)).length;
      const matchRatio = matchCount / keywords.length;
      
      // If more than 40% of keywords match, return this answer
      if (matchRatio > 0.4) {
        return entry.answer;
      }
    }
    
    return null; // No good match found
  }
};

module.exports = openaiService;