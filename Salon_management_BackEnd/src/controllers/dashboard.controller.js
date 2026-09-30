const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const User = require('../models/User');
const Service = require('../models/Service');
const Wage = require('../models/Wage');

const getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user._id;
    const today = new Date().toISOString().split('T')[0];

    const [upcomingAppointments, pastAppointments, recentOrders, totalSpent] = await Promise.all([
      Appointment.find({
        customer: customerId,
        date: { $gte: today },
        status: { $nin: ['Cancelled', 'Completed'] },
      })
        .populate('barber', 'name avatar')
        .populate('service', 'name price duration category')
        .sort({ date: 1, timeSlot: 1 })
        .limit(5),

      Appointment.find({
        customer: customerId,
        status: 'Completed',
      })
        .populate('barber', 'name')
        .populate('service', 'name price category')
        .sort({ date: -1 })
        .limit(10),

      Order.find({ customer: customerId })
        .sort({ createdAt: -1 })
        .limit(5),

      Appointment.aggregate([
        { $match: { customer: customerId, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    // Favorite services (most booked)
    const favoriteServices = await Appointment.aggregate([
      { $match: { customer: customerId, status: 'Completed' } },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'serviceInfo',
        },
      },
      { $unwind: '$serviceInfo' },
      {
        $project: {
          name: '$serviceInfo.name',
          category: '$serviceInfo.category',
          price: '$serviceInfo.price',
          bookings: '$count',
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        upcomingAppointments,
        pastAppointments,
        recentOrders,
        favoriteServices,
        totalSpent: totalSpent[0]?.total || 0,
        totalAppointments: pastAppointments.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBarberDashboard = async (req, res) => {
  try {
    const barberId = req.user._id;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [todayAppointments, upcomingAppointments, monthlyEarnings, totalCompleted] = await Promise.all([
      Appointment.find({
        barber: barberId,
        date: today,
        status: { $nin: ['Cancelled'] },
      })
        .populate('customer', 'name phone')
        .populate('service', 'name duration price')
        .sort({ timeSlot: 1 }),

      Appointment.find({
        barber: barberId,
        date: { $gt: today },
        status: { $nin: ['Cancelled'] },
      })
        .populate('customer', 'name')
        .populate('service', 'name price')
        .sort({ date: 1, timeSlot: 1 })
        .limit(10),

      Wage.aggregate([
        { $match: { barber: barberId, month: currentMonth, year: currentYear } },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$totalEarning' },
            totalCommission: { $sum: '$commissionEarned' },
            servicesCompleted: { $sum: 1 },
          },
        },
      ]),

      Appointment.countDocuments({ barber: barberId, status: 'Completed' }),
    ]);

    res.json({
      success: true,
      data: {
        todayAppointments,
        upcomingAppointments,
        monthlyEarnings: monthlyEarnings[0] || { totalEarnings: 0, totalCommission: 0, servicesCompleted: 0 },
        totalCompleted,
        commissionRate: req.user.commissionRate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReceptionistDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [todayAppointments, pendingAppointments, availableBarbers, recentCustomers] = await Promise.all([
      Appointment.find({ date: today })
        .populate('customer', 'name phone')
        .populate('barber', 'name')
        .populate('service', 'name duration')
        .sort({ timeSlot: 1 }),

      Appointment.find({ status: 'Pending' })
        .populate('customer', 'name phone')
        .populate('barber', 'name')
        .populate('service', 'name')
        .sort({ date: 1 })
        .limit(10),

      User.find({ role: 'Barber', isActive: true }).select('name specializations workingHours'),

      User.find({ role: 'Customer' })
        .select('name email phone')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      success: true,
      data: {
        todayAppointments,
        pendingAppointments,
        availableBarbers,
        recentCustomers,
        todayCount: todayAppointments.length,
        pendingCount: pendingAppointments.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCustomerDashboard, getBarberDashboard, getReceptionistDashboard };
