/**
 * REALbot - Real Estate Chatbot
 * Handles the chat logic and API interactions
 */

class REALbot {
    constructor() {
      // Configuration
      this.apiUrl = '/api';
      this.chatApiUrl = '/api/chat';
      this.sessionId = null;
      this.userData = null;
      
      // Chat state
      this.messageQueue = [];
      this.isProcessing = false;
    }
    
    /**
     * Initialize the chatbot
     */
    async init() {
      try {
        // Generate or retrieve session ID
        this.sessionId = localStorage.getItem('realbotSessionId');
        if (!this.sessionId) {
          this.sessionId = this.generateSessionId();
          localStorage.setItem('realbotSessionId', this.sessionId);
        }
        
        // Initialize session with the server
        const response = await fetch(`${this.chatApiUrl}/session/${this.sessionId}`);
        const data = await response.json();
        
        this.userData = data.userData;
        
        // Load conversation history if available
        await this.loadConversationHistory();
        
        // Add welcome message if it's a new conversation
        const messages = document.querySelectorAll('.message');
        if (messages.length === 0) {
          this.addBotMessage("Hello! I'm REALbot, your real estate assistant. How can I help you today?");
        }
        
        // Update the contact form display
        this.updateContactFormVisibility();
        
        return true;
      } catch (error) {
        console.error('Failed to initialize REALbot:', error);
        return false;
      }
    }
    
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
      return uuid.v4();
    }
    
    /**
     * Load conversation history from server
     */
    async loadConversationHistory() {
      try {
        const response = await fetch(`${this.chatApiUrl}/session/${this.sessionId}/conversation`);
        if (!response.ok) {
          throw new Error('Failed to load conversation history');
        }
        
        const data = await response.json();
        
        // Clear current messages
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        // Add messages to chat
        data.conversation.forEach(msg => {
          if (msg.role === 'user') {
            this.addUserMessage(msg.content, false);
          } else if (msg.role === 'assistant') {
            this.addBotMessage(msg.content, false);
          }
        });
        
        // Update user data
        this.userData = data.userData;
        
        // Scroll to bottom
        this.scrollToBottom();
      } catch (error) {
        console.error('Error loading conversation history:', error);
        // Fallback to welcome message if history can't be loaded
        this.addBotMessage("Hello! I'm REALbot, your real estate assistant. How can I help you today?");
      }
    }
    
    /**
     * Send a message to the chatbot
     */
    async sendMessage(message) {
      // Add message to queue
      this.messageQueue.push(message);
      
      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }
    }
    
    /**
     * Process message queue
     */
    async processQueue() {
      if (this.messageQueue.length === 0) {
        this.isProcessing = false;
        return;
      }
      
      this.isProcessing = true;
      const message = this.messageQueue.shift();
      
      try {
        // Add user message to chat
        this.addUserMessage(message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Send message to server
        const response = await fetch(`${this.chatApiUrl}/session/${this.sessionId}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        });
        
        // Hide typing indicator
        this.hideTypingIndicator();
        
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
        
        // Process response
        const data = await response.json();
        
        // Add bot message to chat
        this.addBotMessage(data.message);
        
        // Update user data
        this.userData = data.userData;
        
        // Check if contact form should be displayed
        this.updateContactFormVisibility();
        
        // Continue processing queue
        this.processQueue();
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Hide typing indicator
        this.hideTypingIndicator();
        
        // Add error message
        this.addBotMessage("I'm sorry, I'm having trouble connecting to my knowledge base. Please try again in a moment.");
        
        // Continue processing queue (with a delay to avoid rapid error messages)
        setTimeout(() => this.processQueue(), 1000);
      }
    }
    
    /**
     * Add a user message to the chat
     */
    addUserMessage(message, scroll = true) {
      const chatMessages = document.getElementById('chatMessages');
      const messageElement = document.createElement('div');
      messageElement.className = 'message user';
      messageElement.textContent = message;
      
      // Add timestamp
      const timeElement = document.createElement('div');
      timeElement.className = 'message-time';
      timeElement.textContent = this.formatTime(new Date());
      messageElement.appendChild(timeElement);
      
      chatMessages.appendChild(messageElement);
      
      if (scroll) {
        this.scrollToBottom();
      }
    }
    
    /**
     * Add a bot message to the chat
     */
    addBotMessage(message, scroll = true) {
      const chatMessages = document.getElementById('chatMessages');
      const messageElement = document.createElement('div');
      messageElement.className = 'message bot';
      
      // Process message for links
      const formattedMessage = this.formatMessage(message);
      messageElement.innerHTML = formattedMessage;
      
      // Add timestamp
      const timeElement = document.createElement('div');
      timeElement.className = 'message-time';
      timeElement.textContent = this.formatTime(new Date());
      messageElement.appendChild(timeElement);
      
      chatMessages.appendChild(messageElement);
      
      if (scroll) {
        this.scrollToBottom();
      }
    }
    
    /**
     * Format message to handle links, line breaks, etc.
     */
    formatMessage(message) {
      // Convert URLs to clickable links
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      let formattedMessage = message.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
      
      // Convert line breaks to <br> tags
      formattedMessage = formattedMessage.replace(/\n/g, '<br>');
      
      return formattedMessage;
    }
    
    /**
     * Show the typing indicator
     */
    showTypingIndicator() {
      const chatMessages = document.getElementById('chatMessages');
      
      // Check if typing indicator already exists
      if (document.querySelector('.typing-indicator')) {
        return;
      }
      
      const indicator = document.createElement('div');
      indicator.className = 'typing-indicator';
      indicator.innerHTML = '<span></span><span></span><span></span>';
      
      chatMessages.appendChild(indicator);
      this.scrollToBottom();
    }
    
    /**
     * Hide the typing indicator
     */
    hideTypingIndicator() {
      const indicator = document.querySelector('.typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    }
    
    /**
     * Format time for chat messages
     */
    formatTime(date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    /**
     * Reset the chat
     */
    resetChat() {
      // Generate new session ID
      this.sessionId = this.generateSessionId();
      localStorage.setItem('realbotSessionId', this.sessionId);
      
      // Clear messages
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.innerHTML = '';
      
      // Reset user data
      this.userData = {
        budget: null,
        preferredLocation: null,
        propertyType: null,
        timeline: null,
        readyToContact: false,
        contactInfo: null
      };
      
      // Hide contact form
      document.getElementById('contactForm').style.display = 'none';
      
      // Add welcome message
      this.addBotMessage("Hello! I'm REALbot, your real estate assistant. How can I help you today?");
      
      // Initialize new session
      fetch(`${this.chatApiUrl}/session/${this.sessionId}`);
    }
    
    /**
     * Update contact form visibility based on user data
     */
    updateContactFormVisibility() {
      const contactForm = document.getElementById('contactForm');
      
      if (this.userData && this.userData.readyToContact && !this.userData.contactInfo) {
        contactForm.style.display = 'block';
      } else {
        contactForm.style.display = 'none';
      }
    }
    
    /**
     * Submit contact form
     */
    async submitContactForm(formData) {
      try {
        const response = await fetch(`${this.chatApiUrl}/session/${this.sessionId}/contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to submit contact form');
        }
        
        const data = await response.json();
        
        // Update user data
        this.userData = data.userData;
        
        // Hide contact form
        document.getElementById('contactForm').style.display = 'none';
        
        // Add confirmation message
        this.addBotMessage("Thank you! One of our real estate agents will contact you soon to discuss viewing properties that match your needs.");
        
        return true;
      } catch (error) {
        console.error('Error submitting contact form:', error);
        return false;
      }
    }
  }
  
  // Create global REALbot instance
  const realbot = new REALbot();