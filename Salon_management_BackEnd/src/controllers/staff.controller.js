const User = require('../models/User');
const TimeOff = require('../models/TimeOff');
const Appointment = require('../models/Appointment');

const getAllStaff = async (req, res) => {
  try {
    const { specialization, isActive, search } = req.query;
    const query = { role: { $in: ['Barber', 'Receptionist'] } };

    if (specialization) query.specializations = { $in: [specialization] };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.name = { $regex: search, $options: 'i' };

    const staff = await User.find(query).select('-password').sort({ name: 1 });

    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStaffById = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id).select('-password');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    // Get appointment stats
    const completedAppointments = await Appointment.countDocuments({
      barber: staff._id,
      status: 'Completed',
    });

    const upcomingAppointments = await Appointment.countDocuments({
      barber: staff._id,
      status: { $in: ['Pending', 'Confirmed'] },
      date: { $gte: new Date().toISOString().split('T')[0] },
    });

    res.json({
      success: true,
      data: {
        ...staff.toObject(),
        stats: { completedAppointments, upcomingAppointments },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createStaff = async (req, res) => {
  try {
    const { name, email, password, role, phone, specializations, experience, workingHours, workingDays, commissionRate } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const staff = await User.create({
      name,
      email,
      password: password || 'default123',
      role: role || 'Barber',
      phone,
      specializations,
      experience,
      workingHours,
      workingDays,
      commissionRate,
    });

    const staffData = await User.findById(staff._id).select('-password');
    res.status(201).json({ success: true, data: staffData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { name, phone, specializations, experience, workingHours, workingDays, commissionRate, isActive, bio } = req.body;

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, specializations, experience, workingHours, workingDays, commissionRate, isActive, bio },
      { new: true, runValidators: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateShift = async (req, res) => {
  try {
    const { workingHours, workingDays } = req.body;

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { workingHours, workingDays },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStaffAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const allBarbers = await User.find({ role: 'Barber', isActive: true }).select('name specializations workingHours workingDays');

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    // Get time offs
    const timeOffs = await TimeOff.find({
      startDate: { $lte: date },
      endDate: { $gte: date },
      status: 'Approved',
    }).select('barber');

    const onLeaveIds = timeOffs.map(t => t.barber.toString());

    const availability = allBarbers.map(barber => ({
      ...barber.toObject(),
      isWorking: barber.workingDays.includes(dayOfWeek) && !onLeaveIds.includes(barber._id.toString()),
      isOnLeave: onLeaveIds.includes(barber._id.toString()),
    }));

    res.json({ success: true, data: availability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const requestTimeOff = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    const timeOff = await TimeOff.create({
      barber: req.user._id,
      startDate,
      endDate,
      reason,
    });

    res.status(201).json({ success: true, data: timeOff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllTimeOffs = async (req, res) => {
  try {
    const { status, barber } = req.query;
    const query = {};
    if (status) query.status = status;
    if (barber) query.barber = barber;

    const timeOffs = await TimeOff.find(query)
      .populate('barber', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: timeOffs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyTimeOffs = async (req, res) => {
  try {
    const timeOffs = await TimeOff.find({ barber: req.user._id })
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: timeOffs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTimeOffStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const timeOff = await TimeOff.findByIdAndUpdate(
      req.params.id,
      { status, approvedBy: req.user._id },
      { new: true }
    ).populate('barber', 'name email');

    if (!timeOff) {
      return res.status(404).json({ success: false, message: 'Time off request not found' });
    }

    res.json({ success: true, data: timeOff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  updateShift,
  getStaffAvailability,
  requestTimeOff,
  getAllTimeOffs,
  updateTimeOffStatus,
  getMyTimeOffs,
};
