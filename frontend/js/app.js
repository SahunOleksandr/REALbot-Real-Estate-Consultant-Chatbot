/**
 * REALbot - Application JavaScript
 * Handles UI interactions and application logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize REALbot
    const initSuccess = await realbot.init();
    if (!initSuccess) {
      alert('Failed to initialize REALbot. Please try refreshing the page.');
    }
    
    // DOM Elements
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const resetButton = document.getElementById('resetChat');
    const questionButtons = document.querySelectorAll('.question-btn');
    const agentContactForm = document.getElementById('agentContactForm');
    const adminLink = document.getElementById('adminLink');
    const adminModal = document.getElementById('adminModal');
    const closeModalBtn = document.querySelector('.close');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Event Listeners
    
    // Send Message
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Reset Chat
    resetButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to start a new chat? This will clear your current conversation.')) {
        realbot.resetChat();
      }
    });
    
    // Sample Question Buttons
    questionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        userInput.value = btn.textContent;
        sendMessage();
      });
    });
    
    // Agent Contact Form
    agentContactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        bestTime: document.getElementById('bestTime').value
      };
      
      const submitBtn = agentContactForm.querySelector('.submit-btn');
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;
      
      const success = await realbot.submitContactForm(formData);
      
      submitBtn.textContent = 'Connect with Agent';
      submitBtn.disabled = false;
      
      if (!success) {
        alert('Failed to submit contact form. Please try again.');
      } else {
        agentContactForm.reset();
      }
    });
    
    // Admin Modal
    adminLink.addEventListener('click', (e) => {
      e.preventDefault();
      adminModal.style.display = 'block';
      loadAdminData();
    });
    
    closeModalBtn.addEventListener('click', () => {
      adminModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
      if (e.target === adminModal) {
        adminModal.style.display = 'none';
      }
    });
    
    // Tab Navigation
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons and panels
        tabButtons.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked button and corresponding panel
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`${tabId}Tab`).classList.add('active');
        
        // Load specific data for the tab
        if (tabId === 'analytics') {
          loadAnalyticsData();
        } else if (tabId === 'knowledge') {
          loadKnowledgeBase();
        }
      });
    });
    
    // Add event listeners for knowledge base editor
    document.getElementById('addQuestion').addEventListener('click', addKnowledgeItem);
    document.getElementById('saveKnowledge').addEventListener('click', saveKnowledgeBase);
    
    // Functions
    
    /**
     * Send user message to REALbot
     */
    function sendMessage() {
      const message = userInput.value.trim();
      if (message) {
        realbot.sendMessage(message);
        userInput.value = '';
        userInput.focus();
      }
    }
    
    /**
     * Load data for admin dashboard
     */
    function loadAdminData() {
      // Load analytics data by default
      loadAnalyticsData();
    }
    
    /**
     * Load analytics data for admin dashboard
     */
    async function loadAnalyticsData() {
      try {
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        // Render keyword chart
        renderKeywordChart(data.topKeywords);
        
        // Render conversations chart
        renderConversationsChart(data.conversationsByDay);
      } catch (error) {
        console.error('Error loading analytics data:', error);
        alert('Failed to load analytics data. Please try again.');
      }
    }
    
    /**
     * Render keyword frequency chart
     */
    function renderKeywordChart(keywords) {
      const ctx = document.getElementById('keywordsChart');
      
      // Clear previous chart if it exists
      if (window.keywordsChart) {
        window.keywordsChart.destroy();
      }
      
      // Prepare data
      const labels = keywords.map(k => k.keyword);
      const counts = keywords.map(k => k.count);
      
      // Create new chart
      window.keywordsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Frequency',
            data: counts,
            backgroundColor: '#1A4B8C',
            borderColor: '#1A4B8C',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Count'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Keyword'
              }
            }
          }
        }
      });
    }
    
    /**
     * Render conversations by day chart
     */
    function renderConversationsChart(conversationsByDay) {
      const ctx = document.getElementById('conversationsChart');
      
      // Clear previous chart if it exists
      if (window.conversationsChart) {
        window.conversationsChart.destroy();
      }
      
      // Sort data by date
      conversationsByDay.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Prepare data
      const labels = conversationsByDay.map(d => {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
      const counts = conversationsByDay.map(d => d.count);
      
      // Create new chart
      window.conversationsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Conversations',
            data: counts,
            backgroundColor: 'rgba(26, 75, 140, 0.2)',
            borderColor: '#1A4B8C',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Count'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          }
        }
      });
    }
    
    /**
     * Load knowledge base for admin dashboard
     */
    async function loadKnowledgeBase() {
      try {
        const response = await fetch('/api/knowledge');
        const data = await response.json();
        
        renderKnowledgeEditor(data.questions);
      } catch (error) {
        console.error('Error loading knowledge base:', error);
        alert('Failed to load knowledge base. Please try again.');
      }
    }
    
    /**
     * Render knowledge base editor
     */
    function renderKnowledgeEditor(questions) {
      const editorContainer = document.getElementById('knowledgeEditor');
      editorContainer.innerHTML = '';
      
      questions.forEach((question, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'knowledge-item';
        itemElement.setAttribute('data-id', question.id);
        
        itemElement.innerHTML = `
          <h4>
            Question #${index + 1} 
            <span class="item-category">Category: ${question.category}</span>
          </h4>
          <div class="form-group">
            <label>Question:</label>
            <textarea class="question-text">${question.question}</textarea>
          </div>
          <div class="form-group">
            <label>Answer:</label>
            <textarea class="answer-text">${question.answer}</textarea>
          </div>
          <div class="form-group">
            <label>Category:</label>
            <input type="text" class="category-text" value="${question.category}">
          </div>
          <div class="item-actions">
            <button class="action-btn delete-item">Delete</button>
          </div>
        `;
        
        editorContainer.appendChild(itemElement);
        
        // Add event listener for delete button
        itemElement.querySelector('.delete-item').addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this question?')) {
            itemElement.remove();
          }
        });
      });
    }
    
    /**
     * Add new knowledge item
     */
    function addKnowledgeItem() {
      const editorContainer = document.getElementById('knowledgeEditor');
      const newId = Date.now(); // Generate a unique ID
      
      const itemElement = document.createElement('div');
      itemElement.className = 'knowledge-item';
      itemElement.setAttribute('data-id', newId);
      
      itemElement.innerHTML = `
        <h4>
          New Question
          <span class="item-category">Category: general</span>
        </h4>
        <div class="form-group">
          <label>Question:</label>
          <textarea class="question-text"></textarea>
        </div>
        <div class="form-group">
          <label>Answer:</label>
          <textarea class="answer-text"></textarea>
        </div>
        <div class="form-group">
          <label>Category:</label>
          <input type="text" class="category-text" value="general">
        </div>
        <div class="item-actions">
          <button class="action-btn delete-item">Delete</button>
        </div>
      `;
      
      editorContainer.appendChild(itemElement);
      
      // Add event listener for delete button
      itemElement.querySelector('.delete-item').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this question?')) {
          itemElement.remove();
        }
      });
      
      // Scroll to new item
      itemElement.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Save knowledge base
     */
    async function saveKnowledgeBase() {
      const items = document.querySelectorAll('.knowledge-item');
      const questions = [];
      
      items.forEach((item, index) => {
        const id = parseInt(item.getAttribute('data-id')) || index + 1;
        const question = item.querySelector('.question-text').value.trim();
        const answer = item.querySelector('.answer-text').value.trim();
        const category = item.querySelector('.category-text').value.trim();
        
        if (question && answer) {
          questions.push({
            id,
            category,
            question,
            answer
          });
        }
      });
      
      try {
        const response = await fetch('/api/knowledge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ questions })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save knowledge base');
        }
        
        alert('Knowledge base saved successfully!');
      } catch (error) {
        console.error('Error saving knowledge base:', error);
        alert('Failed to save knowledge base. Please try again.');
      }
    }
  });