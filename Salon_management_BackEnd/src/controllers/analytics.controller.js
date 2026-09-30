const Appointment = require('../models/Appointment');
const Order = require('../models/Order');
const User = require('../models/User');
const Service = require('../models/Service');
const Wage = require('../models/Wage');

const getRevenueAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    // Revenue from appointments
    const appointmentRevenue = await Appointment.aggregate([
      {
        $match: {
          status: 'Completed',
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Revenue from orders
    const orderRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'Cancelled' },
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => {
      const apptData = appointmentRevenue.find(a => a._id === index + 1) || { revenue: 0, count: 0 };
      const orderData = orderRevenue.find(o => o._id === index + 1) || { revenue: 0, count: 0 };
      return {
        month,
        appointmentRevenue: apptData.revenue,
        orderRevenue: orderData.revenue,
        totalRevenue: apptData.revenue + orderData.revenue,
        appointmentCount: apptData.count,
        orderCount: orderData.count,
      };
    });

    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.totalRevenue, 0);

    res.json({ success: true, data: { monthlyData, totalRevenue, year: currentYear } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserGrowthAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, role: '$role' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => {
      const monthData = userGrowth.filter(u => u._id.month === index + 1);
      return {
        month,
        customers: monthData.find(d => d._id.role === 'Customer')?.count || 0,
        barbers: monthData.find(d => d._id.role === 'Barber')?.count || 0,
        total: monthData.reduce((sum, d) => sum + d.count, 0),
      };
    });

    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'Customer' });

    res.json({ success: true, data: { monthlyData, totalUsers, totalCustomers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getServicePopularity = async (req, res) => {
  try {
    const serviceStats = await Appointment.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$service',
          bookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
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
          serviceName: '$serviceInfo.name',
          category: '$serviceInfo.category',
          price: '$serviceInfo.price',
          bookings: 1,
          totalRevenue: 1,
        },
      },
    ]);

    // Category breakdown
    const categoryStats = await Appointment.aggregate([
      { $match: { status: 'Completed' } },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceInfo',
        },
      },
      { $unwind: '$serviceInfo' },
      {
        $group: {
          _id: '$serviceInfo.category',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { bookings: -1 } },
    ]);

    res.json({ success: true, data: { serviceStats, categoryStats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStaffPerformance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);
    const endDate = new Date(currentYear, currentMonth, 0);

    const performance = await Appointment.aggregate([
      {
        $match: {
          status: 'Completed',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$barber',
          completedAppointments: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'barberInfo',
        },
      },
      { $unwind: '$barberInfo' },
      {
        $project: {
          barberName: '$barberInfo.name',
          commissionRate: '$barberInfo.commissionRate',
          completedAppointments: 1,
          totalRevenue: 1,
          commissionEarned: {
            $multiply: ['$totalRevenue', { $divide: ['$barberInfo.commissionRate', 100] }],
          },
        },
      },
      { $sort: { completedAppointments: -1 } },
    ]);

    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOverviewStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalCustomers,
      totalStaff,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      totalRevenue,
      totalOrders,
      activeServices,
    ] = await Promise.all([
      User.countDocuments({ role: 'Customer' }),
      User.countDocuments({ role: 'Barber' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: today }),
      Appointment.countDocuments({ status: 'Pending' }),
      Appointment.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ status: { $ne: 'Cancelled' } }),
      Service.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalStaff,
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders,
        activeServices,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMonthlyAppointments = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const data = await Appointment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, status: '$status' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => {
      const monthEntries = data.filter(d => d._id.month === index + 1);
      return {
        month,
        completed: monthEntries.find(e => e._id.status === 'Completed')?.count || 0,
        cancelled: monthEntries.find(e => e._id.status === 'Cancelled')?.count || 0,
        pending: monthEntries.find(e => e._id.status === 'Pending')?.count || 0,
        total: monthEntries.reduce((sum, e) => sum + e.count, 0),
      };
    });

    res.json({ success: true, data: monthlyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRevenueAnalytics,
  getUserGrowthAnalytics,
  getServicePopularity,
  getStaffPerformance,
  getOverviewStats,
  getMonthlyAppointments,
};
