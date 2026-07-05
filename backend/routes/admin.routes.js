const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/leave.models');
const User = require('../models/user.models');
const { auth, adminAuth } = require('../middleware/auth');

// Get all leave requests (Admin only)
router.get('/requests', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const requests = await LeaveRequest.find(filter)
      .populate('employeeId', 'name email employeeId department')
      .sort({ createdAt: -1 });
    
    console.log(`📋 Found ${requests.length} leave requests`);
    res.json(requests);
  } catch (error) {
    console.error('❌ Error fetching requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject leave request (Admin only)
router.put('/requests/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    console.log(`📝 Updating request ${id} to ${status}`);

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected"' });
    }

    const request = await LeaveRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ 
        error: `Request already processed. Current status: ${request.status}` 
      });
    }

    // Update request
    request.status = status;
    request.adminComment = adminComment || '';
    await request.save();

    // Update leave balance if approved
    if (status === 'approved') {
      const user = await User.findById(request.employeeId);
      if (user) {
        user.leaveBalance -= request.daysRequested;
        await user.save();
        console.log(`✅ Leave balance updated for ${user.email}: ${user.leaveBalance} days remaining`);
      }
    }

    await request.populate('employeeId', 'name email employeeId');
    
    console.log(`✅ Request ${id} ${status} successfully`);
    res.json(request);
  } catch (error) {
    console.error('❌ Error updating request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all employees (Admin only)
router.get('/employees', auth, adminAuth, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update employee leave balance (Admin only)
router.put('/employees/:id/balance', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveBalance } = req.body;

    if (leaveBalance === undefined || leaveBalance < 0) {
      return res.status(400).json({ error: 'Invalid leave balance value' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    user.leaveBalance = leaveBalance;
    await user.save();

    res.json({ message: 'Leave balance updated', balance: user.leaveBalance });
  } catch (error) {
    console.error('❌ Error updating balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get statistics (Admin only)
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const pendingRequests = await LeaveRequest.countDocuments({ status: 'pending' });
    const approvedToday = await LeaveRequest.countDocuments({
      status: 'approved',
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const totalRequests = await LeaveRequest.countDocuments();

    res.json({
      totalEmployees,
      pendingRequests,
      approvedToday,
      totalRequests
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;