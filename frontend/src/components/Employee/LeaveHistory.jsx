import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

// Material-UI Components
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
} from '@mui/material';

// Material-UI Icons
import {
  History as HistoryIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
} from '@mui/icons-material';

const LeaveHistory = () => {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!token) {
        setError('Please login to view your leave history');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/leaves/my-leaves', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📋 Leave history:', response.data);
      setLeaves(response.data);
    } catch (error) {
      console.error('❌ Error fetching leaves:', error);
      setError(error.response?.data?.error || 'Failed to fetch leave history');
    }
    setLoading(false);
  };

  const getStatusChip = (status) => {
    const configs = {
      pending: { 
        label: 'Pending', 
        icon: <PendingIcon />,
        sx: { 
          background: 'rgba(255, 193, 7, 0.15)',
          color: '#ffd54f',
          border: '1px solid rgba(255, 193, 7, 0.1)',
        }
      },
      approved: { 
        label: 'Approved', 
        icon: <ApprovedIcon />,
        sx: { 
          background: 'rgba(76, 175, 80, 0.15)',
          color: '#81c784',
          border: '1px solid rgba(76, 175, 80, 0.1)',
        }
      },
      rejected: { 
        label: 'Rejected', 
        icon: <RejectedIcon />,
        sx: { 
          background: 'rgba(244, 67, 54, 0.15)',
          color: '#e57373',
          border: '1px solid rgba(244, 67, 54, 0.1)',
        }
      },
    };
    const config = configs[status] || configs.pending;
    return <Chip icon={config.icon} label={config.label} size="small" sx={config.sx} />;
  };

  if (loading) {
    return (
      <Box sx={{ py: 2 }}>
        <LinearProgress sx={{ 
          borderRadius: 2,
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          }
        }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography sx={{ color: '#e57373' }}>{error}</Typography>
        <Button onClick={fetchLeaves} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

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
          <HistoryIcon sx={{ color: '#6C63FF' }} />
          Leave History
          <Chip
            label={`${leaves.length} records`}
            size="small"
            sx={{
              ml: 1,
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          />
          <Button size="small" onClick={fetchLeaves} sx={{ color: 'rgba(255,255,255,0.5)', ml: 'auto' }}>
            Refresh
          </Button>
        </Typography>

        {leaves.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <HistoryIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              No leave requests found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.2)' }}>
              Apply for leave to see your history here
            </Typography>
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.04)',
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'rgba(255,255,255,0.02)',
                  '& th': {
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }
                }}>
                  <TableCell>Dates</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Admin Comment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow
                    key={leave._id}
                    sx={{
                      '&:hover': {
                        background: 'rgba(255,255,255,0.02)',
                      },
                      '& td': {
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.8)',
                      },
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {format(new Date(leave.startDate), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                          to {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${leave.daysRequested} days`}
                        size="small"
                        sx={{
                          background: 'rgba(255,255,255,0.04)',
                          color: 'rgba(255,255,255,0.5)',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 150 }}>
                        {leave.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(leave.status)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        {leave.adminComment || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveHistory;