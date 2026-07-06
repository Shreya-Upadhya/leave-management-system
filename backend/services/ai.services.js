// backend/services/ai.services.js
const axios = require('axios');

class AIService {
  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY;
    // Google currently issues two key formats: legacy "AIzaSy..." keys, and
    // newer "AQ." keys (what you have). Both are valid — don't reject "AQ."
    this.useAI = !!(this.geminiKey && (this.geminiKey.startsWith('AIza') || this.geminiKey.startsWith('AQ.')));

    // Current models as of mid-2026 — gemini-1.0/1.5/2.0 have all been shut
    // down by Google, so calling them 404s. Check
    // https://ai.google.dev/gemini-api/docs/models if these ever 404 too.
    // gemini-2.5-flash confirmed working on this key's free tier.
    // gemini-3.5-flash is tried first since it's the newest model, but can
    // 503 under high demand — falls through to 2.5-flash automatically.
    // gemini-2.5-pro is NOT included: it returns 429 (quota: 0) on the free
    // tier for this key, so it would just waste a call on every request.
    // Add it back if you upgrade to a paid billing plan.
    this.models = ['gemini-3.5-flash', 'gemini-2.5-flash'];

    console.log('AI Mode:', this.useAI ? '✅ Gemini AI' : '⚠️ Rule-Based');
    console.log('API Key Present:', !!this.geminiKey);
    if (this.geminiKey) {
      console.log('API Key Prefix:', this.geminiKey.substring(0, 10) + '...');
      console.log('API Key Format:', this.geminiKey.startsWith('AQ.') ? 'AQ. (new format — sent via header)' : 'AIza (legacy — sent via query param)');
    }
  }

  async getResponse(query, context = {}) {
    if (this.useAI) {
      const prompt = `You are a helpful HR assistant for a company's leave management system.
                     Provide clear, concise, and helpful answers about leave policies, procedures, and best practices.
                     Be friendly and professional in your responses.

                     User Context:
                     - Name: ${context.name || 'Employee'}
                     - Role: ${context.role || 'user'}
                     - Leave Balance: ${context.balance !== undefined ? context.balance : 'N/A'} days

                     User Question: ${query}

                     Please provide a helpful, specific response to this question.`;

      for (const model of this.models) {
        console.log(`🤖 Trying ${model}...`);
        const response = await this.callGeminiAPI(model, prompt);
        if (response) {
          console.log('✅ Gemini response received from', model);
          return { text: response, source: 'gemini-ai', modelUsed: model };
        }
      }

      console.log('⚠️ All Gemini models failed, using fallback');
      return {
        text: this.getRuleBasedResponse(query, context),
        source: 'rule-based-fallback',
        modelUsed: null,
        error: 'All configured Gemini models failed or are unavailable'
      };
    }

    console.log('🔄 Using rule-based response (no valid Gemini key configured)');
    return {
      text: this.getRuleBasedResponse(query, context),
      source: 'rule-based-fallback',
      modelUsed: null
    };
  }

  async callGeminiAPI(model, prompt) {
    try {
      // KEY FIX: "AQ." format keys must be sent as the X-goog-api-key header.
      // The old code passed the key as a ?key= query param, which Google's
      // docs show working for legacy AIza keys but NOT reliably for AQ. keys
      // — that mismatch is the most likely reason every call was failing.
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.geminiKey
          },
          timeout: 15000
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
      console.error(`❌ Unexpected response structure from ${model}:`, JSON.stringify(response.data, null, 2));
      return null;

    } catch (error) {
      if (error.response) {
        console.error(`❌ ${model} failed — status ${error.response.status}:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(`❌ ${model} failed:`, error.message);
      }
      return null;
    }
  }

  async testConnection() {
    if (!this.useAI) return { ok: false, reason: 'no valid key configured' };
    for (const model of this.models) {
      const result = await this.callGeminiAPI(model, 'Reply with just the word: ok');
      if (result) return { ok: true, modelUsed: model };
    }
    return { ok: false, reason: 'all models failed' };
  }

  getRuleBasedResponse(query, context) {
    const q = query.toLowerCase().trim();
    console.log('📝 Using rule-based response for:', q);

    if (q.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return `Hello! 👋 I'm your HR assistant. How can I help you today? I can assist with:
- 📊 Checking your leave balance
- 📝 Applying for leave
- 📋 Understanding leave policies
- 🔍 Tracking request status
- 👑 Admin actions (approve/reject)

What would you like to know about?`;
    }

    if (q.length < 3) {
      return `I'm here to help! Could you please be more specific about what you'd like to know? For example:
- "What is my leave balance?"
- "How do I apply for leave?"
- "What is the company policy?"

I'm here to assist with all your leave management needs! 😊`;
    }

    if (q.includes('leave balance') || q.includes('how many days') || q.includes('balance') || q.includes('remaining')) {
      if (context.balance !== undefined && context.balance !== null) {
        return `You have ${context.balance} leave days remaining. You can apply for leave through the dashboard.`;
      }
      return 'Your leave balance is available in your dashboard. Please check there for accurate information.';
    }

    if (q.includes('apply') || q.includes('request') || q.includes('submit') || q.includes('take leave')) {
      return `To apply for leave:
1. Go to your dashboard
2. Click "Apply for Leave"
3. Select start and end dates
4. Provide a reason for your leave
5. Submit the request
Your manager will review and approve/reject it. You'll receive a notification once a decision is made.`;
    }

    if (q.includes('approve') || q.includes('reject') || q.includes('admin') || q.includes('manager')) {
      return 'As an admin, you can approve or reject leave requests from the admin dashboard. Simply review each request and choose the appropriate action. You can also add comments to explain your decision.';
    }

    if (q.includes('policy') || q.includes('rules') || q.includes('regulation') || q.includes('company')) {
      return `Our leave policy:
- Employees get 15 annual leave days per year
- Leave requests must be made at least 2 working days in advance
- Weekends and public holidays are not counted as leave days
- Maximum 5 consecutive days without manager approval
- All leaves require a valid reason
- Sick leave requires a medical certificate for 3+ days`;
    }

    if (q.includes('status') || q.includes('track') || q.includes('check')) {
      return `You can check your leave request status in your dashboard under "Leave History". Statuses include:
- PENDING: Waiting for review
- APPROVED: Request accepted
- REJECTED: Request declined
You'll receive an email notification when your request status changes.`;
    }

    if (q.includes('help') || q.includes('what can you do') || q.includes('capabilities')) {
      return `I'm here to help with leave management. I can assist you with:
- 📊 Checking your leave balance
- 📝 Guiding you through the leave application process
- 📋 Explaining company leave policies
- 🔍 Tracking your request status
- 👑 Admin actions (approve/reject requests)

What would you like to know about?`;
    }

    return `I'm here to help with leave management. You can ask me about:
- 📊 Leave balance
- 📝 How to apply for leave
- 📋 Leave policies
- 🔍 Request status
- 👑 Admin actions (approve/reject)

What would you like to know more about?`;
  }
}

module.exports = new AIService();