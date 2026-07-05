import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Stack } from '@mui/material';

// Material-UI Components
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Avatar,
  Divider,
  InputAdornment,
  Alert,
  LinearProgress,
} from '@mui/material';

// Material-UI Icons
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  AdminPanelSettings as AdminIcon,
  Chat as ChatIcon,
  ExitToApp as LogoutIcon,
  Login as LoginIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  People as PeopleIcon,
  Send as SendIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

// Reusable date field component
function DateField({ label, value, onChange }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
        {label}
      </Typography>
      <TextField fullWidth type="date" value={value} onChange={onChange} />
    </Box>
  );
}

function App() {
  // ✅ USE AUTHCONTEXT INSTEAD OF LOCAL STATE
  const { user, login, logout, isAuthenticated, isAdmin } = useAuth();
  
  const [view, setView] = useState('home');
  const [backendData, setBackendData] = useState(null);

  // Leave Management
  const [leaveBalance, setLeaveBalance] = useState(15);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [leaveStatus, setLeaveStatus] = useState(null);

  // Admin State
  const [pendingRequests, setPendingRequests] = useState([]);
  const [adminStats, setAdminStats] = useState({ totalEmployees: 0, pendingRequests: 0, approvedToday: 0 });

  // AI Chat
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Good day. How may I assist you with leave management?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Check if user is logged in via AuthContext
  useEffect(() => {
    if (isAuthenticated) {
      setView('dashboard');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadDemoData();
    setBackendData({ status: 'connected', version: '1.0.0' });
  }, []);

  const loadDemoData = () => {
    setLeaveHistory([
      { id: 1, start: '2026-06-10', end: '2026-06-12', days: 3, status: 'approved', reason: 'Annual Vacation' },
      { id: 2, start: '2026-06-20', end: '2026-06-21', days: 2, status: 'pending', reason: 'Personal Leave' },
      { id: 3, start: '2026-06-05', end: '2026-06-05', days: 1, status: 'rejected', reason: 'Sick Leave' },
    ]);
    setLeaveBalance(10);
    setPendingRequests([
      { id: 1, employee: 'Robert Chen', start: '2026-07-05', end: '2026-07-07', days: 3, reason: 'Family Event', department: 'Engineering' },
      { id: 2, employee: 'Sarah Williams', start: '2026-07-10', end: '2026-07-12', days: 3, reason: 'Vacation', department: 'Marketing' },
    ]);
    setAdminStats({ totalEmployees: 24, pendingRequests: 2, approvedToday: 5 });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    console.log('🔐 Logging in with:', email);
    
    // ✅ USE AUTHCONTEXT LOGIN
    const result = await login(email, password);
    
    if (result.success) {
      console.log('✅ Login successful!');
      // ✅ Check if token was stored
      const storedToken = localStorage.getItem('token');
      console.log('🔍 Token in localStorage:', storedToken ? '✅ Present' : '❌ Missing');
      setView('dashboard');
    } else {
      console.error('❌ Login failed:', result.error);
      alert(result.error || 'Login failed. Please check credentials.');
    }
  };

  const handleLogout = () => {
    // ✅ USE AUTHCONTEXT LOGOUT
    logout();
    setView('home');
  };

  const handleApplyLeave = (e) => {
    e.preventDefault();
    const { startDate, endDate, reason } = leaveForm;
    if (!startDate || !endDate || !reason) {
      alert('Please complete all required fields');
      return;
    }

    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    if (days > leaveBalance) {
      alert(`Insufficient balance. Remaining: ${leaveBalance} days`);
      return;
    }

    setLeaveHistory([
      { id: Date.now(), start: startDate, end: endDate, days, status: 'pending', reason },
      ...leaveHistory,
    ]);

    setLeaveBalance(leaveBalance - days);
    setLeaveStatus({ type: 'success', message: 'Leave application submitted successfully' });
    setLeaveForm({ startDate: '', endDate: '', reason: '' });
    setTimeout(() => setLeaveStatus(null), 4000);
  };

  const handleAdminAction = (id, action) => {
    setPendingRequests(pendingRequests.map((req) => (req.id === id ? { ...req, status: action } : req)));
    setLeaveStatus({ type: 'success', message: `Request ${action} successfully` });
    setTimeout(() => setLeaveStatus(null), 3000);
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      const responses = {
        balance: `Your current leave balance is ${leaveBalance} days.`,
        apply: 'To apply for leave: Navigate to Dashboard → Leave Application → Select dates → Submit request.',
        policy: 'Corporate Policy: 15 annual leave days per year. Requests require 48 hours notice.',
        status: 'Track your leave status in the Dashboard under Leave History.',
        approve: 'Administrators can manage requests through the Admin Panel.',
        department: `You are in the ${user?.department || 'General'} department.`,
      };

      let response = "I'm here to assist with leave management. Please specify your query.";
      const lowerInput = chatInput.toLowerCase();
      for (const [key, value] of Object.entries(responses)) {
        if (lowerInput.includes(key)) {
          response = value;
          break;
        }
      }

      setChatMessages([...chatMessages, userMessage, { role: 'assistant', content: response }]);
      setChatLoading(false);
    }, 1000);
  };

  const getStatusChip = (status) => {
    const configs = {
      approved: { label: 'Approved', color: 'success', icon: <ApprovedIcon /> },
      pending: { label: 'Pending', color: 'warning', icon: <PendingIcon /> },
      rejected: { label: 'Rejected', color: 'error', icon: <RejectedIcon /> },
    };
    const config = configs[status] || configs.pending;
    return <Chip size="small" icon={config.icon} label={config.label} color={config.color} />;
  };

  // Navigation
  const renderNav = () => {
    const handleLogoClick = () => {
      if (!isAuthenticated) {
        setView('home');
      }
    };

    return (
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, rgba(82,39,255,0.96) 0%, rgba(255,159,252,0.95) 100%)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 12px 36px rgba(82,39,255,0.18)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, py: 1.25, px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.18)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25)',
              }}
            >
              <BusinessIcon sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: 'white',
                letterSpacing: 0.4,
                cursor: isAuthenticated ? 'default' : 'pointer',
                '&:hover': {
                  color: isAuthenticated ? 'white' : '#fdf2ff',
                }
              }}
              onClick={handleLogoClick}
            >
              Nrolled
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <>
                <Button
                  size="small"
                  startIcon={<DashboardIcon />}
                  onClick={() => setView('dashboard')}
                  sx={{
                    color: 'white',
                    borderRadius: '999px',
                    px: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                  }}
                >
                  Dashboard
                </Button>
                {isAdmin && (
                  <Button
                    size="small"
                    startIcon={<AdminIcon />}
                    onClick={() => setView('admin')}
                    sx={{
                      color: 'white',
                      borderRadius: '999px',
                      px: 1.5,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                    }}
                  >
                    Admin
                  </Button>
                )}
                <Button
                  size="small"
                  startIcon={<ChatIcon />}
                  onClick={() => setView('chat')}
                  sx={{
                    color: 'white',
                    borderRadius: '999px',
                    px: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                  }}
                >
                  Assistant
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.25, borderColor: 'rgba(255,255,255,0.3)' }} />
                <Chip
                  avatar={<Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>{user?.avatar || 'U'}</Avatar>}
                  label={user?.name}
                  size="small"
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '& .MuiChip-label': { fontWeight: 600 },
                  }}
                />
                <Button
                  size="small"
                  color="inherit"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{
                    color: 'white',
                    borderRadius: '999px',
                    px: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  startIcon={<HomeIcon />}
                  onClick={() => setView('home')}
                  sx={{
                    color: 'white',
                    borderRadius: '999px',
                    px: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                  }}
                >
                  Home
                </Button>
                <Button
                  variant="contained"
                  startIcon={<LoginIcon />}
                  onClick={() => setView('login')}
                  sx={{
                    bgcolor: 'white',
                    color: '#5227FF',
                    borderRadius: '999px',
                    px: 1.75,
                    fontWeight: 700,
                    boxShadow: '0 8px 20px rgba(255,255,255,0.25)',
                    '&:hover': { bgcolor: '#f8f4ff' },
                  }}
                >
                  Sign In
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    );
  };

  // Home Page hero section
  const renderHome = () => (
    <Box sx={{ py: 4 }}>
      <Box sx={{ 
        position: 'relative', 
        width: '100%', 
        height: '500px', 
        borderRadius: 4,
        overflow: 'hidden',
        mb: 4,
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        background: 'linear-gradient(135deg, #FF9FFC 0%, #5227FF 100%)'
      }}>
        <Box sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.25
        }} />
        
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          p: 3,
          bgcolor: 'rgba(0,0,0,0.2)',
        }}>
          <BusinessIcon sx={{ fontSize: 60, mb: 2, opacity: 0.9 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            Leave Management System
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.95, mb: 4, fontWeight: 400, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            Streamline leave requests with intelligent automation
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="large" 
              sx={{ 
                bgcolor: 'white', 
                color: '#5227FF',
                '&:hover': { bgcolor: '#f0f2f5' } 
              }} 
              onClick={() => setView('login')}
            >
              <LoginIcon sx={{ mr: 1 }} /> Sign In
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              sx={{ 
                borderColor: 'white', 
                color: 'white',
                '&:hover': { 
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                } 
              }} 
              onClick={() => setView('chat')}
            >
              <ChatIcon sx={{ mr: 1 }} /> AI Assistant
            </Button>
          </Box>
        </Box>
      </Box>

      <Stack 
        direction={{ xs: 'column', sm: 'row' }}
        spacing={3}
        sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {[
          { icon: <AssignmentIcon sx={{ fontSize: 40 }} />, color: '#4a67e8', title: 'Apply for Leave', body: 'Submit requests in seconds' },
          { icon: <PendingIcon sx={{ fontSize: 40 }} />, color: '#ed6c02', title: 'Track Status', body: 'Real-time request updates' },
          { icon: <ChatIcon sx={{ fontSize: 40 }} />, color: '#2e7d32', title: 'AI Assistant', body: '24/7 policy guidance' },
          { icon: <AdminIcon sx={{ fontSize: 40 }} />, color: '#d32f2f', title: 'Admin Panel', body: 'Complete request management' },
        ].map((f) => (
          <Card 
            key={f.title}
            sx={{ 
              flex: '1 1 200px',
              minWidth: 200,
              maxWidth: 280,
              textAlign: 'center', 
              p: 2,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ color: f.color, mb: 1 }}>{f.icon}</Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>{f.title}</Typography>
              <Typography variant="body2" color="text.secondary">{f.body}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );

  // Login Page - UPDATED to use AuthContext
  const renderLogin = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <Card sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" sx={{ textAlign: 'center', mb: 1 }}>
          <LoginIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Sign In
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          Access your leave management dashboard
        </Typography>

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            defaultValue="admin@nrolled.com"
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            defaultValue="admin123"
            sx={{ mb: 3 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button fullWidth variant="contained" type="submit" size="large">
            Sign In
          </Button>
        </form>

        <Divider sx={{ my: 3 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Use admin@nrolled.com / admin123 or employee@test.com / employee123
          </Typography>
        </Box>
      </Card>
    </Box>
  );

  // Dashboard
  const renderDashboard = () => (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">
          <DashboardIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
          Dashboard
        </Typography>
        <Chip label={`Welcome, ${user?.name}`} color="primary" />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Days Remaining', value: leaveBalance, color: '#4a67e8', bg: '#e8ecfd' },
          { label: 'Pending Requests', value: leaveHistory.filter((l) => l.status === 'pending').length, color: '#ed6c02', bg: '#fff3e0' },
          { label: 'Approved', value: leaveHistory.filter((l) => l.status === 'approved').length, color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'Rejected', value: leaveHistory.filter((l) => l.status === 'rejected').length, color: '#d32f2f', bg: '#fbe9e7' },
        ].map((s) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.label}>
            <Card sx={{ bgcolor: s.bg, height: '100%' }}>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <CalendarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Apply for Leave
              </Typography>
              <form onSubmit={handleApplyLeave}>
                <DateField
                  label="Start Date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                />
                <DateField
                  label="End Date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Reason"
                  multiline
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <Button fullWidth variant="contained" type="submit" startIcon={<SendIcon />}>
                  Submit Request
                </Button>
              </form>
              {leaveStatus && leaveStatus.type === 'success' && (
                <Alert severity="success" sx={{ mt: 2 }}>{leaveStatus.message}</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <AssignmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Leave History
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Dates</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveHistory.map((leave) => (
                      <TableRow hover key={leave.id}>
                        <TableCell>{leave.start} → {leave.end}</TableCell>
                        <TableCell>{leave.days}</TableCell>
                        <TableCell>{getStatusChip(leave.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Admin Panel
  const renderAdmin = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        <AdminIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
        Administration Panel
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />, value: adminStats.totalEmployees, label: 'Total Employees' },
          { icon: <PendingIcon sx={{ fontSize: 40, color: '#ed6c02' }} />, value: adminStats.pendingRequests, label: 'Pending Requests' },
          { icon: <TrendingIcon sx={{ fontSize: 40, color: '#2e7d32' }} />, value: adminStats.approvedToday, label: 'Approved Today' },
        ].map((s) => (
          <Grid size={{ xs: 12, sm: 4 }} key={s.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {s.icon}
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Pending Approvals</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingRequests.map((req) => (
                  <TableRow hover key={req.id}>
                    <TableCell><strong>{req.employee}</strong></TableCell>
                    <TableCell>{req.department}</TableCell>
                    <TableCell>{req.start} → {req.end}</TableCell>
                    <TableCell>{req.days}</TableCell>
                    <TableCell>
                      <Button size="small" color="success" onClick={() => handleAdminAction(req.id, 'approved')}>
                        Approve
                      </Button>
                      <Button size="small" color="error" onClick={() => handleAdminAction(req.id, 'rejected')}>
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  // AI Chat
  const renderChat = () => (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <ChatIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h5">AI Assistant</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ask about leave policies, balance, or application procedures
          </Typography>

          <Box sx={{ height: 350, overflowY: 'auto', p: 2, bgcolor: '#f5f7fa', borderRadius: 2 }}>
            {chatMessages.map((msg, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    boxShadow: 'none',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(20,30,60,0.08)',
                  }}
                >
                  <Typography variant="body2">{msg.content}</Typography>
                </Paper>
              </Box>
            ))}
            {chatLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Paper sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, boxShadow: 'none' }}>
                  <LinearProgress sx={{ width: 100 }} />
                </Paper>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask a question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChat()}
              disabled={chatLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleChat} disabled={chatLoading || !chatInput.trim()}>
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {['What is my balance?', 'How to apply for leave?', 'What is the policy?', 'Check my status'].map((q) => (
              <Chip key={q} label={q} size="small" clickable onClick={() => setChatInput(q)} variant="outlined" />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {renderNav()}
      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        {view === 'home' && renderHome()}
        {view === 'login' && renderLogin()}
        {view === 'dashboard' && isAuthenticated && renderDashboard()}
        {view === 'admin' && isAuthenticated && isAdmin && renderAdmin()}
        {view === 'chat' && renderChat()}
      </Container>
    </Box>
  );
}

export default App;