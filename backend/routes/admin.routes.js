const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/leave.models');
const User = require('../models/user.models');
const { auth, adminAuth } = require('../middleware/auth');

// Get all leave requests (admin only)
router.get('/all-leaves', auth, adminAuth, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find()
      .populate('employeeId', 'name email employeeId department')
      .sort({ createdAt: -1 });
    console.log(`📋 Admin fetched ${leaves.length} leave requests`);
    res.json(leaves);
  } catch (error) {
    console.error('❌ Error fetching all leaves:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending leave requests (admin only)
router.get('/pending', auth, adminAuth, async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ status: 'pending' })
      .populate('employeeId', 'name email employeeId department')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    console.error('❌ Error fetching pending leaves:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve or reject a leave request (admin only)
router.patch('/review/:id', auth, adminAuth, async (req, res) => {
  try {
    const { status, comment } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }

    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: `This leave has already been ${leave.status}` });
    }

    leave.status = status;
    leave.adminComment = comment || '';
    leave.updatedAt = Date.now();

    // If rejected, restore balance
    if (status === 'rejected') {
      const user = await User.findById(leave.employeeId);
      if (user) {
        user.leaveBalance += leave.daysRequested;
        await user.save();
      }
    }

    await leave.save();
    await leave.populate('employeeId', 'name email employeeId department');

    console.log(`✅ Leave ${leave._id} ${status} by admin`);
    res.json({ message: `Leave request ${status}`, leave });
  } catch (error) {
    console.error('❌ Error reviewing leave:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all employees (admin only)
router.get('/employees', auth, adminAuth, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get admin dashboard stats
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalRequests = await LeaveRequest.countDocuments();
    const pendingRequests = await LeaveRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await LeaveRequest.countDocuments({ status: 'approved' });
    const rejectedRequests = await LeaveRequest.countDocuments({ status: 'rejected' });

    res.json({
      totalEmployees,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
