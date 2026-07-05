import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Material-UI Components
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';

// Material-UI Icons
import {
  Business as BusinessIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar 
      position="sticky" 
      color="transparent"
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.08) !important',
        backdropFilter: 'blur(24px) !important',
        WebkitBackdropFilter: 'blur(24px) !important',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08) !important',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.08) !important',
        '& .MuiToolbar-root': {
          background: 'transparent !important',
        },
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: 1,
        background: 'transparent !important',
        minHeight: { xs: '64px', sm: '70px' },
      }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
            }}
          >
            <BusinessIcon sx={{ color: '#ffffff', fontSize: 22 }} />
          </Box>
          <Typography 
            variant="h6" 
            component={Link} 
            to="/"
            sx={{ 
              fontWeight: 700, 
              color: '#ffffff',
              textDecoration: 'none',
              '&:hover': {
                color: '#6C63FF',
              },
              transition: 'color 0.3s ease',
              letterSpacing: '-0.5px',
            }}
          >
            Nrolled
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255,255,255,0.3)',
              display: { xs: 'none', sm: 'block' },
              fontWeight: 400,
              letterSpacing: '0.5px',
            }}
          >
            Leave Management
          </Typography>
        </Box>

        {/* Navigation Links */}
        {isAuthenticated ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(8px)',
            padding: '4px 8px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <Button
              component={Link}
              to="/dashboard"
              startIcon={<DashboardIcon />}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                borderRadius: '10px',
                px: 1.5,
                '&:hover': {
                  color: '#ffffff',
                  background: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              Dashboard
            </Button>
            
            {isAdmin && (
              <Button
                component={Link}
                to="/admin"
                startIcon={<AdminIcon />}
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  borderRadius: '10px',
                  px: 1.5,
                  '&:hover': {
                    color: '#ffffff',
                    background: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                Admin
              </Button>
            )}

            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: 'rgba(255,255,255,0.06)',
              mx: 0.5,
            }} />

            {/* User Profile */}
            <Box>
              <Chip
                avatar={
                  <Avatar sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    width: 32,
                    height: 32,
                    border: '2px solid rgba(255,255,255,0.1)',
                  }}>
                    {user?.name?.charAt(0) || 'U'}
                  </Avatar>
                }
                label={user?.name || 'User'}
                onClick={handleMenuOpen}
                sx={{
                  background: 'rgba(255,255,255,0.04)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.06)',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                  },
                  borderRadius: '12px',
                  px: 0.5,
                }}
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    background: 'rgba(30, 20, 60, 0.85)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 3,
                    minWidth: 200,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                    mt: 1,
                  }
                }}
              >
                <MenuItem disabled sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ 
                      width: 40, 
                      height: 40,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}>
                      {user?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                        {user?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                        {user?.email}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
                <MenuItem 
                  onClick={() => {
                    handleMenuClose();
                    navigate('/dashboard');
                  }}
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.04)',
                    }
                  }}
                >
                  <DashboardIcon sx={{ mr: 1.5, fontSize: 20 }} />
                  Dashboard
                </MenuItem>
                <MenuItem 
                  onClick={() => {
                    handleMenuClose();
                    handleLogout();
                  }}
                  sx={{ 
                    color: '#e57373',
                    '&:hover': {
                      background: 'rgba(244, 67, 54, 0.08)',
                    }
                  }}
                >
                  <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              startIcon={<PersonIcon />}
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
                borderRadius: '12px',
                px: 3,
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Sign In
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;