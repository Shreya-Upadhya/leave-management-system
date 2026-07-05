import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// Material-UI Components
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';

// Material-UI Icons
import {
  Send as SendIcon,
  CalendarToday as CalendarIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';

const LeaveApplication = ({ onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Form Data:', formData);
    console.log('🔑 Token:', token ? 'Present' : 'Missing');

    if (!token) {
      const errorMsg = 'Please login first';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!formData.startDate || !formData.endDate || !formData.reason) {
      const errorMsg = 'Please fill in all required fields';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // ✅ CORRECT: Create a proper JSON object with string keys
      const payload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
      };

      console.log('📤 Sending payload:', JSON.stringify(payload));

      const response = await axios.post(
        'http://localhost:5000/api/leaves/apply',
        payload,  // ✅ Axios automatically stringifies this with proper JSON format
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Response:', response.data);
      
      setSuccess(true);
      toast.success('Leave application submitted successfully!');
      setFormData({ startDate: '', endDate: '', reason: '' });
      
      if (onSuccess) {
        console.log('🔄 Calling onSuccess callback');
        onSuccess();
      }
    } catch (error) {
      console.error('❌ Error submitting leave:', error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      const errorMsg = error.response?.data?.error || 'Failed to submit application';
      toast.error(errorMsg);
      setError(errorMsg);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  return (
    <Card sx={{
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(8px)',
      border: 'none',
      boxShadow: 'none',
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          color: '#ffffff',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <CalendarIcon sx={{ color: '#6C63FF' }} />
          Apply for Leave
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
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
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.4)',
              },
            }}
          />

          <TextField
            fullWidth
            label="End Date"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: formData.startDate || new Date().toISOString().split('T')[0],
            }}
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
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.4)',
              },
            }}
          />

          <TextField
            fullWidth
            label="Reason"
            name="reason"
            multiline
            rows={4}
            value={formData.reason}
            onChange={handleChange}
            required
            placeholder="Please provide a reason for your leave"
            sx={{ mb: 3 }}
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
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.4)',
              },
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Leave application submitted successfully!
            </Alert>
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={<SendIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #5566d4 0%, #65428a 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              },
              '&.Mui-disabled': {
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>

          {loading && (
            <LinearProgress sx={{ 
              mt: 2,
              borderRadius: 2,
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              }
            }} />
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default LeaveApplication;