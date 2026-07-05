import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// Material-UI Components
import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Stack,
  Alert,
  Avatar,
} from '@mui/material';

// Material-UI Icons
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';

const LeaveRequests = ({ onUpdate }) => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('');
  const [adminComment, setAdminComment] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (!token) {
        toast.error('Please login as admin');
        setLoading(false);
        return;
      }

      const url =
        filter === 'all'
          ? 'http://localhost:5000/api/admin/requests'
          : `http://localhost:5000/api/admin/requests?status=${filter}`;
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📋 Admin requests:', response.data);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/requests/${id}`,
        {
          status,
          adminComment: adminComment || '',
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      toast.success(`Request ${status} successfully!`);
      setDialogOpen(false);
      setAdminComment('');
      fetchRequests();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Action failed');
    }
  };

  const openActionDialog = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setDialogOpen(true);
  };

  const getStatusChip = (status) => {
    const configs = {
      pending: { 
        label: 'Pending', 
        sx: { 
          background: 'rgba(255, 193, 7, 0.15)',
          color: '#ffd54f',
          border: '1px solid rgba(255, 193, 7, 0.1)',
        }
      },
      approved: { 
        label: 'Approved', 
        sx: { 
          background: 'rgba(76, 175, 80, 0.15)',
          color: '#81c784',
          border: '1px solid rgba(76, 175, 80, 0.1)',
        }
      },
      rejected: { 
        label: 'Rejected', 
        sx: { 
          background: 'rgba(244, 67, 54, 0.15)',
          color: '#e57373',
          border: '1px solid rgba(244, 67, 54, 0.1)',
        }
      },
    };
    const config = configs[status] || configs.pending;
    return <Chip label={config.label} size="small" sx={config.sx} />;
  };

  if (loading) {
    return (
      <LinearProgress sx={{ 
        borderRadius: 2,
        '& .MuiLinearProgress-bar': {
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        }
      }} />
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
            Leave Requests
          </Typography>
          <Chip
            label={`${requests.length} requests`}
            sx={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ 
            minWidth: 150,
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255,255,255,0.5)',
            },
          }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Filter"
              startAdornment={<FilterIcon sx={{ mr: 1, fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />}
            >
              <MenuItem value="all">All Requests</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh">
            <IconButton 
              onClick={fetchRequests} 
              sx={{ 
                color: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Table */}
      {requests.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(8px)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <FilterIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            No leave requests found
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>
            {filter === 'all'
              ? 'All requests will appear here'
              : `No ${filter} requests found`}
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(8px)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.04)',
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ 
                background: 'rgba(255,255,255,0.03)',
                '& th': {
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }
              }}>
                <TableCell>Employee</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow
                  key={request._id}
                  sx={{
                    '&:hover': {
                      background: 'rgba(255,255,255,0.03)',
                    },
                    '& td': {
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      color: 'rgba(255,255,255,0.85)',
                    },
                    background: request.status === 'pending' 
                      ? 'rgba(255, 193, 7, 0.04)' 
                      : 'transparent',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}>
                        {request.employeeId?.name?.charAt(0) || 'E'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                          {request.employeeId?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          {request.employeeId?.employeeId || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {format(new Date(request.startDate), 'MMM dd')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        to {format(new Date(request.endDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${request.daysRequested} days`}
                      size="small"
                      sx={{
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        minWidth: 60,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 150,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {request.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(request.status)}</TableCell>
                  <TableCell align="center">
                    {request.status === 'pending' ? (
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<ApproveIcon />}
                          onClick={() => openActionDialog(request, 'approved')}
                          sx={{
                            background: 'rgba(76, 175, 80, 0.15)',
                            color: '#81c784',
                            border: '1px solid rgba(76, 175, 80, 0.1)',
                            textTransform: 'none',
                            '&:hover': {
                              background: 'rgba(76, 175, 80, 0.25)',
                            }
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<RejectIcon />}
                          onClick={() => openActionDialog(request, 'rejected')}
                          sx={{
                            background: 'rgba(244, 67, 54, 0.15)',
                            color: '#e57373',
                            border: '1px solid rgba(244, 67, 54, 0.1)',
                            textTransform: 'none',
                            '&:hover': {
                              background: 'rgba(244, 67, 54, 0.25)',
                            }
                          }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    ) : (
                      <Chip
                        label="Processed"
                        size="small"
                        sx={{
                          background: 'rgba(255,255,255,0.02)',
                          color: 'rgba(255,255,255,0.3)',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(30, 20, 60, 0.9)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 3,
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#ffffff',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {actionType === 'approved' ? (
              <ApproveIcon sx={{ color: '#81c784' }} />
            ) : (
              <RejectIcon sx={{ color: '#e57373' }} />
            )}
            <Typography variant="h6">
              {actionType === 'approved' ? 'Approve' : 'Reject'} Leave Request
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedRequest && (
            <Box>
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.4)', mb: 1 }}>
                  Request Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color: '#ffffff' }}>Employee:</strong> {selectedRequest.employeeId?.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color: '#ffffff' }}>Duration:</strong> {selectedRequest.daysRequested} days
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color: '#ffffff' }}>From:</strong> {format(new Date(selectedRequest.startDate), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color: '#ffffff' }}>To:</strong> {format(new Date(selectedRequest.endDate), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body2" sx={{ gridColumn: '1 / -1', color: 'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color: '#ffffff' }}>Reason:</strong> {selectedRequest.reason}
                  </Typography>
                </Box>
              </Paper>

              <TextField
                fullWidth
                label="Admin Comment (Optional)"
                multiline
                rows={3}
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Add any additional notes for the employee..."
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
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: 'rgba(255,255,255,0.3)' }}>
                      <CommentIcon fontSize="small" />
                    </Box>
                  ),
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <Button 
            onClick={() => setDialogOpen(false)} 
            sx={{ 
              color: 'rgba(255,255,255,0.4)',
              '&:hover': {
                background: 'rgba(255,255,255,0.04)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleAction(selectedRequest?._id, actionType)}
            startIcon={actionType === 'approved' ? <ApproveIcon /> : <RejectIcon />}
            sx={{
              background: actionType === 'approved' 
                ? 'rgba(76, 175, 80, 0.2)' 
                : 'rgba(244, 67, 54, 0.2)',
              color: actionType === 'approved' ? '#81c784' : '#e57373',
              border: `1px solid ${actionType === 'approved' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'}`,
              '&:hover': {
                background: actionType === 'approved' 
                  ? 'rgba(76, 175, 80, 0.35)' 
                  : 'rgba(244, 67, 54, 0.35)',
              }
            }}
          >
            {actionType === 'approved' ? 'Approve' : 'Reject'} Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveRequests;