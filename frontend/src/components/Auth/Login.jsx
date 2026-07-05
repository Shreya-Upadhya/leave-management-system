import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Material-UI Components
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  Divider,
  Chip,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

// Material-UI Icons
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('🔐 Attempting login with:', email);

    const result = await login(email, password);
    
    if (result.success) {
      console.log('✅ Login successful!');
      
      // ✅ Verify token was stored
      const storedToken = localStorage.getItem('token');
      console.log('🔍 Token in localStorage after login:', storedToken ? '✅ Present' : '❌ Missing');
      
      if (storedToken) {
        console.log('Token preview:', storedToken.substring(0, 30) + '...');
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        console.error('❌ Token was not stored in localStorage!');
        toast.error('Login succeeded but token not stored. Please try again.');
      }
    } else {
      console.error('❌ Login failed:', result.error);
      toast.error(result.error || 'Login failed');
    }
    setLoading(false);
  };

  // Quick fill for demo
  const fillAdmin = () => {
    setEmail('admin@nrolled.com');
    setPassword('admin123');
  };

  const fillEmployee = () => {
    setEmail('employee@test.com');
    setPassword('employee123');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <Card sx={{ 
        p: 4, 
        maxWidth: 400, 
        width: '100%',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 4,
      }}>
        <Typography variant="h5" sx={{ textAlign: 'center', mb: 1, color: '#ffffff' }}>
          <LoginIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Sign In
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: 'rgba(255,255,255,0.6)' }}>
          Access your leave management dashboard
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                </InputAdornment>
              ),
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
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                </InputAdornment>
              ),
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
          <Button 
            fullWidth 
            variant="contained" 
            type="submit" 
            size="large"
            disabled={loading}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5566d4 0%, #65428a 100%)',
              },
              py: 1.5,
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </form>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.4)', mb: 1 }}>
          <strong>Quick Login (Click to fill)</strong>
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
          <Chip 
            label="👤 Admin: admin@nrolled.com" 
            onClick={fillAdmin}
            sx={{ 
              background: 'rgba(102, 126, 234, 0.15)', 
              color: '#ffffff',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              cursor: 'pointer',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.25)',
              },
              width: '100%',
              justifyContent: 'center',
            }}
          />
          <Chip 
            label="👤 Employee: employee@test.com" 
            onClick={fillEmployee}
            sx={{ 
              background: 'rgba(76, 175, 80, 0.15)', 
              color: '#ffffff',
              border: '1px solid rgba(76, 175, 80, 0.2)',
              cursor: 'pointer',
              '&:hover': {
                background: 'rgba(76, 175, 80, 0.25)',
              },
              width: '100%',
              justifyContent: 'center',
            }}
          />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', mt: 1 }}>
            Password for both: <strong>admin123</strong> or <strong>employee123</strong>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default Login;