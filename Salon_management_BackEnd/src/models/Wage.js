const mongoose = require('mongoose');

const wageSchema = new mongoose.Schema({
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Barber is required'],
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  },
  date: {
    type: String,
    required: true,
  },
  serviceAmount: {
    type: Number,
    required: true,
  },
  commissionRate: {
    type: Number,
    required: true,
  },
  commissionEarned: {
    type: Number,
    required: true,
  },
  baseSalary: {
    type: Number,
    default: 0,
  },
  tips: {
    type: Number,
    default: 0,
  },
  totalEarning: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Hold'],
    default: 'Pending',
  },
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

wageSchema.index({ barber: 1, month: 1, year: 1 });

module.exports = mongoose.model('Wage', wageSchema);
