// frontend/src/components/AIAssistant.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAI } from '../context/AIContext';
import { useAuth } from '../context/AuthContext';

// Material-UI Components
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Alert,
  Tooltip,
} from '@mui/material';

// Material-UI Icons
import {
  Send as SendIcon,
  SmartToy as RobotIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  CloudOff as OfflineIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

const AIAssistant = () => {
  const { aiStatus, refreshAIStatus, isAIActive } = useAI();
  const { token, isAuthenticated } = useAuth();
  
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I'm your HR assistant. How can I help you today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  useEffect(() => {
    console.log('🔄 AI Status updated:', aiStatus);
    console.log('📦 AI Status in localStorage:', localStorage.getItem('aiStatus'));
  }, [aiStatus]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    setChatError(null);

    try {
      // ✅ Check if user is authenticated
      if (!token || !isAuthenticated) {
        // Use rule-based responses without authentication
        console.log('🔄 User not logged in, using rule-based response');
        const response = getRuleBasedResponse(input);
        const aiMessage = { 
          role: 'assistant', 
          content: response,
          source: 'rule-based-fallback',
          isAI: false,
          isGuest: true
        };
        setMessages(prev => [...prev, aiMessage]);
        toast.info('Using offline knowledge base (guest mode)');
        setLoading(false);
        return;
      }

      // ✅ User is logged in, try AI
      const response = await axios.post('http://localhost:5000/api/ai/chat', {
        message: input
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const source = response.data.source || 'unknown';
      const isAI = source === 'gemini-ai';
      
      const aiMessage = { 
        role: 'assistant', 
        content: response.data.response,
        source: source,
        isAI: isAI
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // ✅ Refresh AI status if changed
      if (source !== aiStatus.source) {
        refreshAIStatus();
      }

    } catch (error) {
      console.error('❌ AI chat error:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Please login to use the AI assistant. Using offline knowledge base.';
        // Fallback to rule-based
        const fallbackResponse = getRuleBasedResponse(input);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: fallbackResponse,
          source: 'rule-based-fallback',
          isAI: false
        }]);
        setChatError('Using offline knowledge base');
        setLoading(false);
        return;
      }
      
      toast.error('Failed to get response from AI');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage,
        source: 'error',
        isAI: false
      }]);
    }
    setLoading(false);
  };

  // ✅ Rule-based responses for guest users
  const getRuleBasedResponse = (query) => {
    const q = query.toLowerCase().trim();

    if (q.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return `Hello! 👋 I'm your HR assistant. How can I help you today? I can assist with:
- 📊 Checking your leave balance
- 📝 Applying for leave
- 📋 Understanding leave policies
- 🔍 Tracking request status

Please login to access full features and personalized information.`;
    }

    if (q.includes('leave balance') || q.includes('how many days') || q.includes('balance')) {
      return `To check your leave balance, please login to your account. Once logged in, you'll see your personalized balance in the dashboard.`;
    }

    if (q.includes('apply') || q.includes('request') || q.includes('submit')) {
      return `To apply for leave: 
1. Please login to your account
2. Go to your dashboard
3. Click "Apply for Leave" 
4. Select start and end dates
5. Provide a reason for your leave
6. Submit the request

You'll receive a notification once your request is reviewed.`;
    }

    if (q.includes('policy') || q.includes('rules') || q.includes('regulation')) {
      return `Our leave policy:
- Employees get 15 annual leave days per year
- Leave requests must be made at least 2 working days in advance
- Weekends and public holidays are not counted as leave days
- Maximum 5 consecutive days without manager approval
- All leaves require a valid reason
- Sick leave requires a medical certificate for 3+ days

Please login for personalized policy information.`;
    }

    if (q.includes('status') || q.includes('track')) {
      return `To check your leave request status:
1. Please login to your account
2. Go to your dashboard
3. Look for "Leave History" section
4. You'll see all your requests with their status

Statuses include:
- PENDING: Waiting for review
- APPROVED: Request accepted
- REJECTED: Request declined`;
    }

    return `I'm here to help with leave management. You can ask me about:
- 📊 Leave balance
- 📝 How to apply for leave
- 📋 Leave policies
- 🔍 Request status

For personalized information, please login to your account.`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    'What is my balance?',
    'How to apply for leave?',
    'What is the policy?',
    'Check my status',
  ];

  const getStatusChip = () => {
    if (aiStatus.source === 'checking') {
      return {
        label: 'Checking...',
        icon: null,
        color: 'default'
      };
    }
    
    if (aiStatus.isActive && aiStatus.source === 'gemini-ai') {
      return {
        label: 'AI Active',
        icon: <CheckIcon sx={{ fontSize: 16 }} />,
        color: 'success'
      };
    }
    
    if (aiStatus.source === 'rule-based-fallback') {
      return {
        label: isAuthenticated ? 'Offline Mode' : 'Guest Mode',
        icon: isAuthenticated ? <OfflineIcon sx={{ fontSize: 16 }} /> : <LockIcon sx={{ fontSize: 16 }} />,
        color: isAuthenticated ? 'warning' : 'info'
      };
    }
    
    return {
      label: 'Error',
      icon: <ErrorIcon sx={{ fontSize: 16 }} />,
      color: 'error'
    };
  };

  const statusChip = getStatusChip();

  return (
    <Card sx={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 3,
      overflow: 'hidden',
      height: 550,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <CardContent sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}>
        <Avatar sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: 40,
          height: 40,
        }}>
          <RobotIcon />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
            AI Assistant
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            {aiStatus.source === 'gemini-ai' ? 'Powered by Gemini AI' : 
             aiStatus.source === 'rule-based-fallback' && isAuthenticated ? 'Using Knowledge Base' :
             isAuthenticated ? 'Checking status...' : 'Guest Mode - Limited Features'}
          </Typography>
        </Box>
        
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={aiStatus.source === 'gemini-ai' ? 'AI is active and working' : 
                           !isAuthenticated ? 'Login for full AI features' : 'AI service is not available'}>
            <Chip
              icon={statusChip.icon}
              label={statusChip.label}
              size="small"
              color={statusChip.color}
              sx={{
                '& .MuiChip-icon': {
                  color: statusChip.color === 'success' ? '#81c784' : 
                         statusChip.color === 'warning' ? '#ffb74d' : 
                         statusChip.color === 'error' ? '#ef9a9a' : 'inherit'
                }
              }}
            />
          </Tooltip>
          
          <Tooltip title="Refresh AI Status">
            <IconButton 
              size="small" 
              onClick={refreshAIStatus}
              sx={{ 
                color: 'rgba(255,255,255,0.3)',
                '&:hover': { color: 'rgba(255,255,255,0.6)' }
              }}
            >
              <RefreshIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>

      {!isAuthenticated && (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 0,
            background: 'rgba(102, 126, 234, 0.08)',
            color: '#90caf9',
            '& .MuiAlert-icon': { color: '#90caf9' }
          }}
        >
          💡 Login to get personalized AI responses and access all features.
        </Alert>
      )}

      {chatError && (
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 0,
            background: 'rgba(255, 152, 0, 0.08)',
            color: '#ffb74d',
            '& .MuiAlert-icon': { color: '#ffb74d' }
          }}
        >
          {chatError}
        </Alert>
      )}

      {/* Messages */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 2,
        '&::-webkit-scrollbar': {
          width: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
        },
      }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '80%' }}>
              {msg.role === 'assistant' && (
                <Avatar sx={{ 
                  width: 28, 
                  height: 28, 
                  background: msg.isAI 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : msg.isGuest 
                    ? 'linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%)'
                    : 'linear-gradient(135deg, #ff9800 0%, #f44336 100%)',
                  fontSize: 14,
                }}>
                  {msg.isAI ? <RobotIcon sx={{ fontSize: 16 }} /> : 
                   msg.isGuest ? '👤' : '📚'}
                </Avatar>
              )}
              <Paper
                sx={{
                  p: 1.5,
                  background: msg.role === 'user' 
                    ? 'rgba(102, 126, 234, 0.2)' 
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${msg.role === 'user' 
                    ? 'rgba(102, 126, 234, 0.1)' 
                    : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: 2,
                  color: '#ffffff',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
                {msg.role === 'assistant' && msg.isGuest !== undefined && (
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mt: 0.5, 
                    color: msg.isGuest ? 'rgba(79, 195, 247, 0.5)' : 
                           msg.isAI ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255, 152, 0, 0.5)',
                    fontSize: '0.6rem'
                  }}>
                    {msg.isGuest ? '👤 Guest Mode' :
                     msg.isAI ? '🤖 AI Generated' : '📚 Knowledge Base'}
                  </Typography>
                )}
              </Paper>
              {msg.role === 'user' && (
                <Avatar sx={{ 
                  width: 28, 
                  height: 28, 
                  background: 'rgba(255,255,255,0.1)',
                  fontSize: 14,
                }}>
                  <PersonIcon sx={{ fontSize: 16 }} />
                </Avatar>
              )}
            </Box>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Paper sx={{ 
              p: 2, 
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 2,
              minWidth: 120,
            }}>
              <LinearProgress sx={{ 
                borderRadius: 2,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                }
              }} />
            </Paper>
          </Box>
        )}
      </Box>

      {/* Quick Questions */}
      <Box sx={{ 
        px: 2, 
        pb: 1,
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        pt: 1.5,
      }}>
        {quickQuestions.map((q) => (
          <Chip
            key={q}
            label={q}
            size="small"
            onClick={() => setInput(q)}
            sx={{
              background: 'rgba(255,255,255,0.02)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.04)',
              '&:hover': {
                background: 'rgba(255,255,255,0.06)',
                color: '#ffffff',
              }
            }}
          />
        ))}
      </Box>

      {/* Input */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        gap: 1,
      }}>
        <TextField
          fullWidth
          size="small"
          placeholder={isAuthenticated ? "Ask a question..." : "Ask a question (guest mode)..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.08)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.15)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(255,255,255,0.3)',
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={loading || !input.trim()}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(135deg, #5566d4 0%, #65428a 100%)',
            },
            '&.Mui-disabled': {
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.2)',
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Card>
  );
};

export default AIAssistant;