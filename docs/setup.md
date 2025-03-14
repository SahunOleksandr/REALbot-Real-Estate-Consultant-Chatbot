# REALbot Setup Guide

REALbot is an AI-powered chatbot designed to assist real estate agents at Elite Properties Group by handling routine client inquiries about property purchases, mortgages, documentation, and neighborhood information.

## Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- OpenAI API key

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/realbot.git
   cd realbot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   PORT=3000
   ```

4. Start the server:
   ```
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

- `/frontend` - Contains all frontend files (HTML, CSS, JavaScript)
- `/backend` - Contains the server-side code
  - `/data` - JSON data files for knowledge base and analytics
  - `/routes` - API routes
  - `/controllers` - Business logic
  - `/services` - External services integration (OpenAI)

## Configuration

### Customizing the Chatbot

1. **Knowledge Base**: Edit the `knowledgeBase.json` file in `/backend/data/` to add or modify real estate questions and answers.

2. **System Prompt**: Customize the chatbot's behavior by editing the `generateSystemPrompt` function in `/backend/services/openaiService.js`.

3. **OpenAI Model**: By default, the chatbot uses the `gpt-3.5-turbo` model. You can change this to `gpt-4` in the `openaiService.js` file for higher quality responses (requires access to GPT-4 API).

### Styling

1. Edit the `style.css` file in `/frontend/css/` to customize the appearance of the chatbot.

2. Corporate colors are defined as CSS variables at the top of the file.

## API Endpoints

### Chat API

- `GET /api/chat/session/:sessionId` - Initialize or get a chat session
- `POST /api/chat/session/:sessionId/message` - Send a message to the chatbot
- `POST /api/chat/session/:sessionId/contact` - Submit user contact information
- `GET /api/chat/session/:sessionId/conversation` - Get conversation history

### Admin API

- `GET /api/analytics` - Get analytics data
- `GET /api/knowledge` - Get knowledge base data
- `POST /api/knowledge` - Update knowledge base data
- `GET /api/health` - Health check endpoint

## Admin Dashboard

The admin dashboard can be accessed by clicking the "Admin" link in the footer. It provides:

1. **Analytics**: View statistics about user questions and conversation frequency
2. **Knowledge Base Management**: Add, edit, or remove questions and answers in the knowledge base

## Deployment

For production deployment:

1. Set up a proper database instead of file-based storage
2. Implement user authentication for the admin dashboard
3. Set up HTTPS
4. Configure environment variables for production

## WhatsApp Integration

For WhatsApp integration (not included in this demo):

1. Sign up for a WhatsApp Business API provider (like Twilio or MessageBird)
2. Create a new webhook endpoint in the backend
3. Connect the webhook to your WhatsApp Business API account
4. Modify the chatbot controller to handle WhatsApp-specific formatting

## Website Integration

To integrate the chatbot with your website:

1. Add the chatbot iframe to your website:
   ```html
   <iframe src="https://your-realbot-url.com" width="400" height="600" style="border: none;"></iframe>
   ```

2. Or use the provided JavaScript widget code:
   ```html
   <script src="https://your-realbot-url.com/widget.js"></script>
   <script>
     REALbotWidget.init({
       position: 'bottom-right',
       color: '#1A4B8C'
     });
   </script>
   ```