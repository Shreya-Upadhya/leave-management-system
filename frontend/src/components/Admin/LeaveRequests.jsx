// LeaveRequests.jsx
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import {
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
} from '@mui/icons-material';

const LeaveRequests = ({ onUpdate }) => {
  
  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 4 }}>
        Leave requests are managed in the main dashboard view
      </Typography>
    </Box>
  );
};

export default LeaveRequests;