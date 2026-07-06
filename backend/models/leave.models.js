const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  daysRequested: {
    type: Number,
    required: true,
    min: 1
  },
  adminComment: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

LeaveRequestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

LeaveRequestSchema.index({ employeeId: 1, status: 1 });
LeaveRequestSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
