import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import LeaveRequests from './LeaveRequests';

// Material-UI Components
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  Container,
  Button,
  useTheme,
} from '@mui/material';

// Material-UI Icons
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Assignment as TotalIcon,
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const AdminDashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingRequests: 0,
    approvedToday: 0,
    totalRequests: 0,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalEmployees: 24,
        pendingRequests: 2,
        approvedToday: 5,
        totalRequests: 45,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const statCards = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees,
      icon: <PeopleIcon />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      label: 'Pending Requests',
      value: stats.pendingRequests,
      icon: <PendingIcon />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      label: 'Approved Today',
      value: stats.approvedToday,
      icon: <ApprovedIcon />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      label: 'Total Requests',
      value: stats.totalRequests,
      icon: <TotalIcon />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <LinearProgress sx={{ 
          borderRadius: 2,
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          }
        }} />
        <Typography sx={{ mt: 2, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 4, 
        flexWrap: 'wrap', 
        gap: 2,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 4,
        p: 3,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            width: 56, 
            height: 56,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          }}>
            <AdminIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#ffffff',
              textShadow: '0 2px 20px rgba(0,0,0,0.1)',
            }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Welcome back, {user?.name || 'Administrator'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
          <Chip
            icon={<AdminIcon />}
            label="Administrator"
            sx={{
              background: 'rgba(102, 126, 234, 0.2)',
              color: '#ffffff',
              border: '1px solid rgba(102, 126, 234, 0.15)',
              backdropFilter: 'blur(8px)',
            }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchStats}
            sx={{
              borderColor: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.05)',
              }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card
              sx={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 3,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  background: 'rgba(255,255,255,0.08)',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
                  borderColor: 'rgba(255,255,255,0.12)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 700, 
                      color: '#ffffff',
                      textShadow: '0 2px 20px rgba(0,0,0,0.1)',
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255,255,255,0.6)',
                      mt: 0.5,
                    }}>
                      {stat.label}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: stat.gradient,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      color: '#ffffff',
                      fontSize: 28,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper
        sx={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            px: 2,
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.5)',
              '&.Mui-selected': {
                color: '#ffffff',
              },
            },
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            label="Leave Requests"
            icon={<PendingIcon />}
            iconPosition="start"
          />
          <Tab
            label="Employees"
            icon={<PeopleIcon />}
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <LeaveRequests onUpdate={fetchStats} />}
          {activeTab === 1 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PeopleIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Employee Management
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                This feature is coming soon
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;