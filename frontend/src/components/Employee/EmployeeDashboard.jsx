import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import LeaveApplication from './LeaveApplication';
import LeaveHistory from './LeaveHistory';
import AIAssistant from '../Common/AIAssistant';

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
} from '@mui/material';

// Material-UI Icons
import {
  Dashboard as DashboardIcon,
  Assignment as ApplyIcon,
  History as HistoryIcon,
  Chat as ChatIcon,
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const EmployeeDashboard = () => {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (!token) {
        toast.error('Please login first');
        return;
      }

      // Fetch balance
      const balanceResponse = await axios.get('http://localhost:5000/api/leaves/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBalance(balanceResponse.data.balance);

      // Fetch leave history
      const historyResponse = await axios.get('http://localhost:5000/api/leaves/my-leaves', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const leaves = historyResponse.data;
      
      // Calculate stats
      const stats = leaves.reduce((acc, leave) => {
        acc[leave.status] = (acc[leave.status] || 0) + 1;
        return acc;
      }, {});
      setStats(stats);

      console.log('📊 Dashboard data loaded:', { balance: balanceResponse.data.balance, stats });
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error(error.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const statCards = [
    {
      label: 'Pending Requests',
      value: stats.pending || 0,
      icon: <PendingIcon />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      label: 'Approved Leaves',
      value: stats.approved || 0,
      icon: <ApprovedIcon />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      label: 'Rejected Requests',
      value: stats.rejected || 0,
      icon: <RejectedIcon />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
            {user?.name?.charAt(0) || 'E'}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              color: '#ffffff',
              textShadow: '0 2px 20px rgba(0,0,0,0.1)',
            }}>
             
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                ID: {user?.employeeId || 'EMP001'}
              </Typography>
              <Chip
                label={`${balance} days remaining`}
                size="small"
                sx={{
                  background: 'rgba(102, 126, 234, 0.2)',
                  color: '#ffffff',
                  border: '1px solid rgba(102, 126, 234, 0.15)',
                }}
              />
            </Box>
          </Box>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
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
          <Grid item xs={12} sm={6} md={4} key={stat.label}>
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
            label="Apply for Leave" 
            icon={<ApplyIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="Leave History" 
            icon={<HistoryIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label="AI Assistant" 
            icon={<ChatIcon />} 
            iconPosition="start" 
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <LeaveApplication onSuccess={() => {
              fetchDashboardData();
            }} />
          )}
          {activeTab === 1 && <LeaveHistory />}
          {activeTab === 2 && <AIAssistant />}
        </Box>
      </Paper>
    </Container>
  );
};

export default EmployeeDashboard;