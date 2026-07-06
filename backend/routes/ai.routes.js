// backend/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.services');
const { auth } = require('../middleware/auth');


router.get('/health', async (req, res) => {
  try {
    const keyPresent = !!process.env.GEMINI_API_KEY;
    const keyLooksValid = aiService.useAI;

    let liveCheck = { ok: false, reason: 'skipped - no valid key' };
    if (keyLooksValid) {
      liveCheck = await aiService.testConnection();
    }

    const status = {
      geminiKey: keyPresent,
      keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) : 'none',
      keyFormatValid: keyLooksValid,
      isActive: liveCheck.ok,
      source: liveCheck.ok ? 'gemini-ai' : 'rule-based-fallback',
      modelUsed: liveCheck.modelUsed || null,
      message: liveCheck.ok
        ? `AI service is active (verified with ${liveCheck.modelUsed})`
        : `AI service is using fallback mode: ${liveCheck.reason || 'unknown reason'}`
    };

    console.log('📊 Health check requested, status:', status);
    res.json(status);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      error: 'Failed to check AI status',
      isActive: false,
      source: 'error'
    });
  }
});

// ✅ Protected chat endpoint - requires auth
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('💬 User message:', message);
    console.log('👤 User:', req.user.name, 'Role:', req.user.role);

    const user = req.user;
    const context = {
      name: user.name,
      role: user.role,
      balance: user.leaveBalance || 0
    };

    console.log('📋 Context:', context);

    // getResponse now returns { text, source, modelUsed } based on what
    // ACTUALLY happened this call, not just whether a key is configured.
    const result = await aiService.getResponse(message, context);

    console.log('🤖 Response sent — source:', result.source, '| length:', result.text.length);

    res.json({
      success: true,
      response: result.text,
      source: result.source,       
      modelUsed: result.modelUsed  
    });

  } catch (error) {
    console.error('❌ AI chat error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      response: "I'm sorry, I encountered an error. Please try again later.",
      source: 'error'
    });
  }
});

module.exports = router;