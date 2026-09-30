const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const User = require('../models/User');
const TimeOff = require('../models/TimeOff');

const createAppointment = async (req, res) => {
  try {
    const { service, barber, date, timeSlot, notes } = req.body;

    const serviceDoc = await Service.findById(service);
    if (!serviceDoc) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const barberDoc = await User.findById(barber);
    if (!barberDoc || barberDoc.role !== 'Barber') {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    // Check for scheduling conflicts
    const existingAppointment = await Appointment.findOne({
      barber,
      date,
      timeSlot,
      status: { $nin: ['Cancelled'] },
    });

    if (existingAppointment) {
      return res.status(400).json({ success: false, message: 'This time slot is already booked' });
    }

    // Check barber time off
    const timeOff = await TimeOff.findOne({
      barber,
      startDate: { $lte: date },
      endDate: { $gte: date },
      status: 'Approved',
    });

    if (timeOff) {
      return res.status(400).json({ success: false, message: 'Barber is on leave on this date' });
    }

    // Calculate end time
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + serviceDoc.duration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    const appointment = await Appointment.create({
      customer: req.user._id,
      service,
      barber,
      date,
      timeSlot,
      endTime,
      notes,
      totalAmount: serviceDoc.price,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('customer', 'name email phone')
      .populate('barber', 'name specializations')
      .populate('service', 'name price duration category');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const { status, date, barber, customer, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (date) query.date = date;
    if (barber) query.barber = barber;
    if (customer) query.customer = customer;

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate('customer', 'name email phone')
      .populate('barber', 'name specializations')
      .populate('service', 'name price duration category')
      .sort({ date: -1, timeSlot: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: appointments,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyAppointments = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    const query = { customer: req.user._id };

    if (status) query.status = status;
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query.date = { $gte: today };
      query.status = { $nin: ['Cancelled', 'Completed'] };
    }

    const appointments = await Appointment.find(query)
      .populate('barber', 'name specializations avatar')
      .populate('service', 'name price duration category')
      .sort({ date: -1, timeSlot: -1 });

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBarberAppointments = async (req, res) => {
  try {
    const { status, date } = req.query;
    const query = { barber: req.user._id };

    if (status) query.status = status;
    if (date) query.date = date;

    const appointments = await Appointment.find(query)
      .populate('customer', 'name email phone')
      .populate('service', 'name price duration category')
      .sort({ date: 1, timeSlot: 1 });

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('barber', 'name specializations avatar')
      .populate('service', 'name price duration category');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('customer', 'name email phone')
      .populate('barber', 'name specializations')
      .populate('service', 'name price duration category');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.customer.toString() !== req.user._id.toString() &&
        !['Admin', 'Receptionist'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'Cancelled';
    appointment.cancellationReason = reason || '';
    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rescheduleAppointment = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check conflicts on new date/time
    const conflict = await Appointment.findOne({
      barber: appointment.barber,
      date,
      timeSlot,
      status: { $nin: ['Cancelled'] },
      _id: { $ne: appointment._id },
    });

    if (conflict) {
      return res.status(400).json({ success: false, message: 'New time slot is already booked' });
    }

    appointment.date = date;
    appointment.timeSlot = timeSlot;
    appointment.status = 'Pending';
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('customer', 'name email phone')
      .populate('barber', 'name specializations')
      .populate('service', 'name price duration category');

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json({ success: false, message: 'Barber ID and date are required' });
    }

    const barber = await User.findById(barberId);
    if (!barber || barber.role !== 'Barber') {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    // Check if barber is on leave
    const timeOff = await TimeOff.findOne({
      barber: barberId,
      startDate: { $lte: date },
      endDate: { $gte: date },
      status: 'Approved',
    });

    if (timeOff) {
      return res.json({ success: true, data: [], message: 'Barber is on leave' });
    }

    // Check if the selected day is a working day
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    if (barber.workingDays.length > 0 && !barber.workingDays.includes(dayOfWeek)) {
      return res.json({ success: true, data: [], message: 'Barber does not work on this day' });
    }

    // Generate all possible slots (30 min intervals)
    const startHour = parseInt(barber.workingHours.start.split(':')[0]);
    const endHour = parseInt(barber.workingHours.end.split(':')[0]);
    const allSlots = [];

    for (let h = startHour; h < endHour; h++) {
      allSlots.push(`${String(h).padStart(2, '0')}:00`);
      allSlots.push(`${String(h).padStart(2, '0')}:30`);
    }

    // Get booked slots for this barber on this date
    const bookedAppointments = await Appointment.find({
      barber: barberId,
      date,
      status: { $nin: ['Cancelled'] },
    }).select('timeSlot endTime');

    const bookedSlots = bookedAppointments.map(a => a.timeSlot);

    const availableSlots = allSlots.map(slot => ({
      time: slot,
      available: !bookedSlots.includes(slot),
    }));

    res.json({ success: true, data: availableSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignBarber = async (req, res) => {
  try {
    const { barberId } = req.body;

    const barber = await User.findById(barberId);
    if (!barber || barber.role !== 'Barber') {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { barber: barberId, assignedBy: req.user._id },
      { new: true }
    )
      .populate('customer', 'name email phone')
      .populate('barber', 'name specializations')
      .populate('service', 'name price duration category');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAppointment,
  getAllAppointments,
  getMyAppointments,
  getBarberAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  assignBarber,
};
