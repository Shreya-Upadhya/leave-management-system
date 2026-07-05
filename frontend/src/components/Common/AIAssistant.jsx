import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  Stack,
  Card,
  CardContent,
} from '@mui/material';

// Material-UI Icons
import {
  Send as SendIcon,
  SmartToy as RobotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I'm your HR assistant. How can I help you today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/ai/chat', {
        message: input
      });
      
      const aiMessage = { 
        role: 'assistant', 
        content: response.data.response 
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Failed to get response from AI');
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    setLoading(false);
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

  return (
    <Card sx={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 3,
      overflow: 'hidden',
      height: 500,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <CardContent sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
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
            Powered by OpenAI
          </Typography>
        </Box>
        <Chip
          label="Active"
          size="small"
          sx={{
            ml: 'auto',
            background: 'rgba(76, 175, 80, 0.15)',
            color: '#81c784',
            border: '1px solid rgba(76, 175, 80, 0.1)',
          }}
        />
      </CardContent>

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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: 14,
                }}>
                  <RobotIcon sx={{ fontSize: 16 }} />
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
                <Typography variant="body2">{msg.content}</Typography>
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
          placeholder="Ask a question..."
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