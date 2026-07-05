const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.useAI = !!this.apiKey;
  }

  async getResponse(query, context = {}) {
    // If OpenAI key is not available, use rule-based responses
    if (!this.useAI) {
      return this.getRuleBasedResponse(query, context);
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a helpful HR assistant for a company's leave management system. 
                       Provide clear, concise answers about leave policies, procedures, and best practices.
                       Keep responses professional and helpful.`
            },
            {
              role: 'user',
              content: `Context: ${JSON.stringify(context)}\nQuestion: ${query}`
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error.message);
      return this.getRuleBasedResponse(query, context);
    }
  }

  // Fallback rule-based responses
  getRuleBasedResponse(query, context) {
    const q = query.toLowerCase();
    
    if (q.includes('leave balance') || q.includes('how many days')) {
      if (context.balance !== undefined) {
        return `You have ${context.balance} leave days remaining. You can apply for leave through the dashboard.`;
      }
      return 'Your leave balance is available in your dashboard. Please check there.';
    }
    
    if (q.includes('apply') || q.includes('request')) {
      return `To apply for leave: 
1. Go to your dashboard
2. Click "Apply for Leave"
3. Select start and end dates
4. Provide a reason
5. Submit the request
Your manager will review and approve/reject it.`;
    }
    
    if (q.includes('approve') || q.includes('reject')) {
      return 'As an admin, you can approve or reject leave requests from the admin dashboard. Simply review the request and choose the appropriate action.';
    }
    
    if (q.includes('policy') || q.includes('rules')) {
      return 'Our leave policy: Employees get 15 annual leave days. Requests must be made at least 2 days in advance. Weekends are not counted.';
    }
    
    if (q.includes('status')) {
      return 'You can check your leave request status in your dashboard. Statuses are: PENDING, APPROVED, or REJECTED.';
    }

    return `I'm here to help with leave management. You can ask me about:
- Leave balance
- How to apply for leave
- Leave policies
- Request status
- Admin actions (approve/reject)`;
  }
}

module.exports = new AIService();