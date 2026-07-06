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

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD format.' });
    }

    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({ error: 'Cannot apply for past dates' });
    }

    const days = calculateWorkingDays(start, end);

    if (days <= 0) {
      return res.status(400).json({ error: 'Invalid leave duration. Must be at least 1 working day.' });
    }

    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.leaveBalance < days) {
      return res.status(400).json({
        error: `Insufficient leave balance. Available: ${user.leaveBalance}, Requested: ${days}`
      });
    }

    // Check for overlapping requests
    const overlapping = await LeaveRequest.findOne({
      employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } }
      ]
    });

    if (overlapping) {
      console.log('⚠️ Overlapping leave found:', overlapping._id);
      return res.status(400).json({
        error: 'You already have a pending/approved leave for these dates',
        overlappingRequest: {
          startDate: overlapping.startDate,
          endDate: overlapping.endDate,
          status: overlapping.status
        }
      });
    }

    // Create and save leave request
    const leaveRequest = new LeaveRequest({
      employeeId,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
      daysRequested: days,
      status: 'pending'
    });

    const savedRequest = await leaveRequest.save();
    console.log('✅ Leave request saved:', savedRequest._id);

    // Deduct from balance
    user.leaveBalance -= days;
    await user.save();

    // Populate employee details
    await savedRequest.populate('employeeId', 'name email employeeId department');

    res.status(201).json({
      message: 'Leave application submitted successfully',
      leave: savedRequest,
      remainingBalance: user.leaveBalance
    });
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
    console.log(`📋 Found ${leaves.length} leave requests for user ${req.user.id}`);
    res.json(leaves);
  } catch (error) {
    console.error('❌ Error fetching leaves:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get leave balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('leaveBalance name employeeId');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      balance: user.leaveBalance,
      name: user.name,
      employeeId: user.employeeId
    });
  } catch (error) {
    console.error('❌ Error fetching balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel pending leave
router.delete('/cancel/:id', auth, async (req, res) => {
  try {
    const leave = await LeaveRequest.findOne({
      _id: req.params.id,
      employeeId: req.user.id,
      status: 'pending'
    });

    if (!leave) {
      return res.status(404).json({ error: 'Pending leave request not found or already processed' });
    }

    const user = await User.findById(req.user.id);
    user.leaveBalance += leave.daysRequested;
    await user.save();

    await LeaveRequest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Leave request cancelled', balance: user.leaveBalance });
  } catch (error) {
    console.error('❌ Error cancelling leave:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: calculate working days (excludes weekends)
function calculateWorkingDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

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
