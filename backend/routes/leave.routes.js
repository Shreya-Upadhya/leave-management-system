const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/leave.models');
const User = require('../models/user.models');
const { auth } = require('../middleware/auth');

// Apply for leave
router.post('/apply', auth, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const employeeId = req.user.id;

    console.log('📝 Applying for leave:', { employeeId, startDate, endDate, reason });

    // Validate dates exist
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) {
      return res.status(400).json({ error: 'Cannot apply for past dates' });
    }

    // Calculate working days (excluding weekends)
    const days = calculateWorkingDays(start, end);
    
    if (days <= 0) {
      return res.status(400).json({ error: 'Invalid leave duration' });
    }
    
    // Check balance
    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.leaveBalance < days) {
      return res.status(400).json({ 
        error: `Insufficient leave balance. Available: ${user.leaveBalance}, Requested: ${days}` 
      });
    }

    // Check for overlapping requests - FIXED
    const overlapping = await LeaveRequest.findOne({
      employeeId,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    if (overlapping) {
      return res.status(400).json({ 
        error: 'You already have a pending/approved leave for these dates',
        overlappingRequest: {
          startDate: overlapping.startDate,
          endDate: overlapping.endDate,
          status: overlapping.status
        }
      });
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      employeeId,
      startDate: start,
      endDate: end,
      reason,
      daysRequested: days,
      status: 'pending'
    });

    await leaveRequest.save();
    console.log('✅ Leave request saved:', leaveRequest._id);
    
    // Populate employee details
    await leaveRequest.populate('employeeId', 'name email employeeId');

    res.status(201).json(leaveRequest);
  } catch (error) {
    console.error('❌ Error applying for leave:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get my leave requests
router.get('/my-leaves', auth, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employeeId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    console.error('❌ Error fetching leaves:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get leave balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('leaveBalance');
    res.json({ balance: user?.leaveBalance || 0 });
  } catch (error) {
    console.error('❌ Error fetching balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate working days
function calculateWorkingDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  // Ensure we're counting full days
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

module.exports = router;