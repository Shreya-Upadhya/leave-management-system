import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';

import {
  AppBar, Toolbar, Typography, Button, Container, Box, Card, CardContent,
  Grid, TextField, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Avatar, Divider, InputAdornment,
  Alert, LinearProgress, Stack, CircularProgress,
} from '@mui/material';

import {
  Dashboard as DashboardIcon, Assignment as AssignmentIcon,
  AdminPanelSettings as AdminIcon, Chat as ChatIcon,
  ExitToApp as LogoutIcon, Login as LoginIcon, Home as HomeIcon,
  Person as PersonIcon, CalendarToday as CalendarIcon,
  CheckCircle as ApprovedIcon, Pending as PendingIcon,
  Cancel as RejectedIcon, People as PeopleIcon, Send as SendIcon,
  Business as BusinessIcon, Lock as LockIcon, EventNote as EventIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const API_URL = 'http://localhost:5000/api';

function App() {
  const { user, login, logout, isAuthenticated, isAdmin, token } = useAuth();
  const [view, setView] = useState('home');

  // Employee state - now initialized from API
  const [leaveBalance, setLeaveBalance] = useState(0);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [leaveStatus, setLeaveStatus] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Admin state
  const [allLeaveRequests, setAllLeaveRequests] = useState([]);
  const [adminStats, setAdminStats] = useState({
    totalEmployees: 0, totalRequests: 0, pendingRequests: 0,
    approvedRequests: 0, rejectedRequests: 0,
  });

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Good day. How may I assist you with leave management?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      setView(isAdmin ? 'admin' : 'dashboard');
    }
  }, [isAuthenticated, isAdmin]);

  // ==================== DATA FETCHING (FROM API) ====================

  const fetchEmployeeData = useCallback(async () => {
    if (!token) return;
    setDashboardLoading(true);
    try {
      const [balanceRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/leaves/balance`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/leaves/my-leaves`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setLeaveBalance(balanceRes.data.balance);
      setLeaveHistory(historyRes.data);
      console.log('✅ Employee dashboard data loaded from API');
    } catch (err) {
      console.error('❌ Failed to load employee data:', err.message);
    } finally {
      setDashboardLoading(false);
    }
  }, [token]);

  const fetchAdminData = useCallback(async () => {
    if (!token) return;
    try {
      const [statsRes, leavesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/all-leaves`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setAdminStats(statsRes.data);
      setAllLeaveRequests(leavesRes.data);
      console.log('✅ Admin data loaded from API');
    } catch (err) {
      console.error('❌ Failed to load admin data:', err.message);
    }
  }, [token]);

  useEffect(() => {
    if (view === 'dashboard' && isAuthenticated && !isAdmin) fetchEmployeeData();
    if (view === 'admin' && isAuthenticated && isAdmin) fetchAdminData();
  }, [view, isAuthenticated, isAdmin, fetchEmployeeData, fetchAdminData]);

  // ==================== AUTH ====================

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const result = await login(formData.get('email'), formData.get('password'));
    if (!result.success) {
      alert(result.error || 'Login failed. Please check credentials.');
    }
  };

  const handleLogout = () => { logout(); setView('home'); };

  // ==================== 🔑 LEAVE APPLICATION - NOW CALLS API ====================

  const handleApplyLeave = async (e) => {
    e.preventDefault();

    const { startDate, endDate, reason } = leaveForm;

    if (!startDate || !endDate || !reason) {
      setLeaveStatus({ type: 'error', message: 'Please complete all required fields' });
      return;
    }

    if (!token) {
      setLeaveStatus({ type: 'error', message: 'Please login first' });
      return;
    }

    setLeaveLoading(true);
    setLeaveStatus(null);

    try {
      // 🔑 THIS IS THE CRITICAL FIX:
      // The old code only updated local React state and NEVER called the backend.
      // Now we POST to the real API endpoint, which stores data in MongoDB.
      const response = await axios.post(
        `${API_URL}/leaves/apply`,
        {
          startDate,
          endDate,
          reason: reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Leave submitted to API, saved in DB:', response.data);

      setLeaveStatus({
        type: 'success',
        message: `Leave application submitted! ${response.data.remainingBalance} days remaining.`,
      });

      // Update balance from server response
      setLeaveBalance(response.data.remainingBalance);

      // Refresh history from API
      await fetchEmployeeData();

      // Clear form
      setLeaveForm({ startDate: '', endDate: '', reason: '' });

      setTimeout(() => setLeaveStatus(null), 5000);
    } catch (err) {
      console.error('❌ Failed to submit leave:', err);
      const errorMsg = err.response?.data?.error || 'Failed to submit application';
      setLeaveStatus({ type: 'error', message: errorMsg });
    } finally {
      setLeaveLoading(false);
    }
  };

  // ==================== ADMIN ACTIONS (VIA API) ====================

  const handleAdminAction = async (id, action) => {
    try {
      await axios.patch(
        `${API_URL}/admin/review/${id}`,
        { status: action, comment: `Reviewed by ${user?.name || 'Admin'}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLeaveStatus({ type: 'success', message: `Request ${action} successfully` });
      await fetchAdminData();
      setTimeout(() => setLeaveStatus(null), 3000);
    } catch (err) {
      console.error(`❌ Failed to ${action} leave:`, err);
      setLeaveStatus({
        type: 'error',
        message: err.response?.data?.error || `Failed to ${action} request`,
      });
    }
  };

  // ==================== AI CHAT ====================

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      if (token) {
        const res = await axios.post(
          `${API_URL}/ai/chat`,
          { message: chatInput.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setChatMessages([...updatedMessages, { role: 'assistant', content: res.data.response }]);
      } else {
        const lowerInput = chatInput.toLowerCase();
        let response = "I'm here to assist with leave management. Please specify your query.";
        if (lowerInput.includes('balance')) response = 'Your leave balance is available on your dashboard after logging in.';
        else if (lowerInput.includes('apply')) response = 'To apply for leave, log in first, then go to Dashboard → Apply for Leave.';
        else if (lowerInput.includes('policy')) response = 'Company policy: 15 annual leave days. 48-hour notice required.';
        setChatMessages([...updatedMessages, { role: 'assistant', content: response }]);
      }
    } catch (err) {
      setChatMessages([...updatedMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ==================== HELPERS ====================

  const getStatusChip = (status) => {
    const c = {
      approved: { label: 'Approved', color: 'success', icon: <ApprovedIcon /> },
      pending: { label: 'Pending', color: 'warning', icon: <PendingIcon /> },
      rejected: { label: 'Rejected', color: 'error', icon: <RejectedIcon /> },
    };
    const cfg = c[status] || c.pending;
    return <Chip size="small" icon={cfg.icon} label={cfg.label} color={cfg.color} />;
  };

  const fmtDate = (d) => d ? new Date(d).toISOString().split('T')[0] : 'N/A';

  // ==================== NAVIGATION ====================

  const renderNav = () => (
    <AppBar position="sticky" elevation={0}
      sx={{ background: 'linear-gradient(135deg, rgba(82,39,255,0.96) 0%, rgba(255,159,252,0.95) 100%)',
            backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
      <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, py: 1.25, px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center',
                     justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.18)' }}>
            <BusinessIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', letterSpacing: 0.4,
              cursor: isAuthenticated ? 'default' : 'pointer' }}
            onClick={() => { if (!isAuthenticated) setView('home'); }}>
            Nrolled
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <>
              {!isAdmin && (<Button size="small" startIcon={<DashboardIcon />} onClick={() => setView('dashboard')}
                sx={{ color: 'white', borderRadius: '999px', px: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' } }}>
                Dashboard</Button>)}
              {isAdmin && (<Button size="small" startIcon={<AdminIcon />} onClick={() => setView('admin')}
                sx={{ color: 'white', borderRadius: '999px', px: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' } }}>
                Admin Panel</Button>)}
              <Divider orientation="vertical" flexItem sx={{ mx: 0.25, borderColor: 'rgba(255,255,255,0.3)' }} />
              <Chip avatar={<Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                {user?.name?.charAt(0) || 'U'}</Avatar>}
                label={user?.name || 'User'} size="small"
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.14)',
                      border: '1px solid rgba(255,255,255,0.2)', '& .MuiChip-label': { fontWeight: 600 } }} />
              <Button size="small" color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}
                sx={{ color: 'white', borderRadius: '999px', px: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' } }}>
                Logout</Button>
            </>
          ) : (
            <>
              <Button startIcon={<HomeIcon />} onClick={() => setView('home')}
                sx={{ color: 'white', borderRadius: '999px', px: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' } }}>
                Home</Button>
              <Button variant="contained" startIcon={<LoginIcon />} onClick={() => setView('login')}
                sx={{ bgcolor: 'white', color: '#5227FF', borderRadius: '999px', px: 1.75, fontWeight: 700,
                      '&:hover': { bgcolor: '#f8f4ff' } }}>
                Sign In</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );

  // ==================== PAGES ====================

  const renderHome = () => (
    <Box sx={{ py: 4 }}>
      <Box sx={{ position: 'relative', width: '100%', height: '500px', borderRadius: 4, overflow: 'hidden', mb: 4,
          background: 'linear-gradient(135deg, #FF9FFC 0%, #5227FF 100%)' }}>
        <Box sx={{ position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '40px 40px', opacity: 0.25 }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', color: 'white', textAlign: 'center', p: 3, bgcolor: 'rgba(0,0,0,0.2)' }}>
          <BusinessIcon sx={{ fontSize: 60, mb: 2, opacity: 0.9 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            Leave Management System</Typography>
          <Typography variant="h6" sx={{ opacity: 0.95, mb: 4, fontWeight: 400, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            Streamline leave requests with intelligent automation</Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" size="large" onClick={() => setView('login')}
              sx={{ bgcolor: 'white', color: '#5227FF', '&:hover': { bgcolor: '#f0f2f5' } }}>
              <LoginIcon sx={{ mr: 1 }} /> Sign In</Button>
            <Button variant="outlined" size="large" onClick={() => setView('chat')}
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <ChatIcon sx={{ mr: 1 }} /> AI Assistant</Button>
          </Box>
        </Box>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: <AssignmentIcon sx={{ fontSize: 40 }} />, color: '#4a67e8', title: 'Apply for Leave', body: 'Submit requests in seconds' },
          { icon: <PendingIcon sx={{ fontSize: 40 }} />, color: '#ed6c02', title: 'Track Status', body: 'Real-time request updates' },
          { icon: <ChatIcon sx={{ fontSize: 40 }} />, color: '#2e7d32', title: 'AI Assistant', body: '24/7 policy guidance' },
          { icon: <AdminIcon sx={{ fontSize: 40 }} />, color: '#d32f2f', title: 'Admin Panel', body: 'Complete request management' },
        ].map(f => (
          <Card key={f.title} sx={{ flex: '1 1 200px', minWidth: 200, maxWidth: 280, textAlign: 'center', p: 2,
              transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' } }}>
            <CardContent><Box sx={{ color: f.color, mb: 1 }}>{f.icon}</Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>{f.title}</Typography>
              <Typography variant="body2" color="text.secondary">{f.body}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );

  const renderLogin = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <Card sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" sx={{ textAlign: 'center', mb: 1 }}>
          <LoginIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Sign In</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          Access your leave management dashboard</Typography>
        <form onSubmit={handleLogin}>
          <TextField fullWidth label="Email Address" name="email" type="email" defaultValue="admin@nrolled.com" sx={{ mb: 2 }}
            InputProps={{ startAdornment: (<InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>) }} />
          <TextField fullWidth label="Password" name="password" type="password" defaultValue="admin123" sx={{ mb: 3 }}
            InputProps={{ startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>) }} />
          <Button fullWidth variant="contained" type="submit" size="large">Sign In</Button>
        </form>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ textAlign: 'center' }}>
         
        </Box>
      </Card>
    </Box>
  );

  // 🔑 EMPLOYEE DASHBOARD - API-DRIVEN
  const renderDashboard = () => (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5"><DashboardIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />Dashboard</Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={fetchEmployeeData} variant="outlined">Refresh</Button>
      </Box>

      {dashboardLoading && <LinearProgress sx={{ mb: 3, borderRadius: 2 }} />}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Days Remaining', value: leaveBalance, color: '#4a67e8', bg: '#e8ecfd', icon: <CalendarIcon /> },
          { label: 'Pending', value: leaveHistory.filter(l => l.status === 'pending').length, color: '#ed6c02', bg: '#fff3e0', icon: <PendingIcon /> },
          { label: 'Approved', value: leaveHistory.filter(l => l.status === 'approved').length, color: '#2e7d32', bg: '#e8f5e9', icon: <ApprovedIcon /> },
          { label: 'Rejected', value: leaveHistory.filter(l => l.status === 'rejected').length, color: '#d32f2f', bg: '#fbe9e7', icon: <RejectedIcon /> },
        ].map(s => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card sx={{ bgcolor: s.bg, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box><Typography variant="h4" sx={{ fontWeight: 700, color: s.color }}>{s.value}</Typography>
                    <Typography variant="body2" color="text.secondary">{s.label}</Typography></Box>
                  <Box sx={{ color: s.color, opacity: 0.6 }}>{s.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        {/* Apply Leave Form - NOW POSTS TO API */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <CalendarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />Apply for Leave</Typography>

              <form onSubmit={handleApplyLeave}>
                <TextField fullWidth label="Start Date" type="date" value={leaveForm.startDate}
                  onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  sx={{ mb: 2 }} InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }} />
                <TextField fullWidth label="End Date" type="date" value={leaveForm.endDate}
                  onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  sx={{ mb: 2 }} InputLabelProps={{ shrink: true }}
                  inputProps={{ min: leaveForm.startDate || new Date().toISOString().split('T')[0] }} />
                <TextField fullWidth label="Reason" multiline rows={3} value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Please provide a reason for your leave" sx={{ mb: 2 }} />
                <Button fullWidth variant="contained" type="submit" disabled={leaveLoading}
                  startIcon={leaveLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #5566d4 0%, #65428a 100%)' } }}>
                  {leaveLoading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </form>

              {leaveStatus && (
                <Alert severity={leaveStatus.type} sx={{ mt: 2 }} onClose={() => setLeaveStatus(null)}>
                  {leaveStatus.message}</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Leave History - FROM API */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <AssignmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />Leave History</Typography>
              {leaveHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No leave requests yet. Apply for your first leave!</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow>
                      <TableCell>Dates</TableCell><TableCell>Days</TableCell><TableCell>Reason</TableCell><TableCell>Status</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {leaveHistory.map(l => (
                        <TableRow hover key={l._id}>
                          <TableCell>{fmtDate(l.startDate)} → {fmtDate(l.endDate)}</TableCell>
                          <TableCell>{l.daysRequested}</TableCell>
                          <TableCell>{l.reason}</TableCell>
                          <TableCell>{getStatusChip(l.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // 🔑 ADMIN PANEL - API-DRIVEN
  const renderAdmin = () => (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5"><AdminIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />Administration Panel</Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={fetchAdminData} variant="outlined">Refresh</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />, v: adminStats.totalEmployees, l: 'Total Employees' },
          { icon: <EventIcon sx={{ fontSize: 40, color: '#4a67e8' }} />, v: adminStats.totalRequests, l: 'Total Requests' },
          { icon: <PendingIcon sx={{ fontSize: 40, color: '#ed6c02' }} />, v: adminStats.pendingRequests, l: 'Pending' },
          { icon: <ApprovedIcon sx={{ fontSize: 40, color: '#2e7d32' }} />, v: adminStats.approvedRequests, l: 'Approved' },
          { icon: <RejectedIcon sx={{ fontSize: 40, color: '#d32f2f' }} />, v: adminStats.rejectedRequests, l: 'Rejected' },
        ].map(s => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={s.l}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {s.icon}<Box><Typography variant="h4" sx={{ fontWeight: 700 }}>{s.v}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.l}</Typography></Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>All Employee Leave Requests</Typography>
          {leaveStatus && <Alert severity={leaveStatus.type} sx={{ mb: 2 }} onClose={() => setLeaveStatus(null)}>{leaveStatus.message}</Alert>}
          <TableContainer>
            <Table>
              <TableHead><TableRow>
                <TableCell>Employee</TableCell><TableCell>Department</TableCell><TableCell>Dates</TableCell>
                <TableCell>Days</TableCell><TableCell>Reason</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {allLeaveRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">No leave requests found</TableCell></TableRow>
                ) : allLeaveRequests.map(req => (
                  <TableRow hover key={req._id}>
                    <TableCell><strong>{req.employeeId?.name || 'Unknown'}</strong></TableCell>
                    <TableCell>{req.employeeId?.department || 'N/A'}</TableCell>
                    <TableCell>{fmtDate(req.startDate)} → {fmtDate(req.endDate)}</TableCell>
                    <TableCell>{req.daysRequested}</TableCell>
                    <TableCell>{req.reason}</TableCell>
                    <TableCell>{getStatusChip(req.status)}</TableCell>
                    <TableCell align="right">
                      {req.status === 'pending' ? (<>
                        <Button size="small" color="success" onClick={() => handleAdminAction(req._id, 'approved')}>Approve</Button>
                        <Button size="small" color="error" onClick={() => handleAdminAction(req._id, 'rejected')}>Reject</Button>
                      </>) : (
                        <Typography variant="caption" color="text.secondary">{req.adminComment || `Already ${req.status}`}</Typography>
                      )}
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

  const renderChat = () => (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
      <Card><CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ChatIcon sx={{ color: 'primary.main', fontSize: 28 }} /><Typography variant="h5">AI Assistant</Typography></Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Ask about leave policies, balance, or application procedures</Typography>
        <Box sx={{ height: 350, overflowY: 'auto', p: 2, bgcolor: '#f5f7fa', borderRadius: 2 }}>
          {chatMessages.map((msg, idx) => (
            <Box key={idx} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
              <Paper sx={{ p: 1.5, maxWidth: '80%', bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                  color: msg.role === 'user' ? 'white' : 'text.primary', borderRadius: 2, boxShadow: 'none',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(20,30,60,0.08)' }}>
                <Typography variant="body2">{msg.content}</Typography></Paper>
            </Box>
          ))}
          {chatLoading && <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Paper sx={{ p: 1.5, bgcolor: 'white', borderRadius: 2, boxShadow: 'none' }}><LinearProgress sx={{ width: 100 }} /></Paper></Box>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <TextField fullWidth size="small" placeholder="Ask a question..." value={chatInput}
            onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleChat(); }}
            disabled={chatLoading}
            InputProps={{ endAdornment: (<InputAdornment position="end">
              <IconButton onClick={handleChat} disabled={chatLoading || !chatInput.trim()}><SendIcon /></IconButton></InputAdornment>) }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {['What is my balance?', 'How to apply for leave?', 'What is the policy?', 'Check my status'].map(q => (
            <Chip key={q} label={q} size="small" clickable onClick={() => setChatInput(q)} variant="outlined" />))}
        </Box>
      </CardContent></Card>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {renderNav()}
      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        {view === 'home' && renderHome()}
        {view === 'login' && renderLogin()}
        {view === 'dashboard' && isAuthenticated && !isAdmin && renderDashboard()}
        {view === 'dashboard' && isAuthenticated && isAdmin && renderAdmin()}
        {view === 'admin' && isAuthenticated && isAdmin && renderAdmin()}
        {view === 'admin' && isAuthenticated && !isAdmin && renderDashboard()}
        {view === 'chat' && renderChat()}
      </Container>
    </Box>
  );
}

export default App;
