const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.services');  // Your file is ai.services.js
const { auth } = require('../middleware/auth');
const User = require('../models/user.models');

router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    // Get user context for personalized responses
    const user = await User.findById(req.user.id).select('leaveBalance name role');
    const context = {
      balance: user.leaveBalance,
      role: user.role,
      name: user.name
    };

    const response = await aiService.getResponse(message, context);
    res.json({ response });
  } catch (error) {
    console.error('❌ AI Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;