const Wage = require('../models/Wage');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

const getWageRecords = async (req, res) => {
  try {
    const { month, year, barber, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (barber) query.barber = barber;
    if (status) query.status = status;

    const total = await Wage.countDocuments(query);
    const wages = await Wage.find(query)
      .populate('barber', 'name email commissionRate')
      .populate('service', 'name price')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: wages,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyEarnings = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { barber: req.user._id };

    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    const wages = await Wage.find(query)
      .populate('service', 'name price')
      .sort({ date: -1 });

    const totalEarnings = wages.reduce((sum, w) => sum + w.totalEarning, 0);
    const totalCommission = wages.reduce((sum, w) => sum + w.commissionEarned, 0);
    const totalServices = wages.length;

    res.json({
      success: true,
      data: wages,
      summary: {
        totalEarnings,
        totalCommission,
        totalServices,
        commissionRate: req.user.commissionRate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMonthlySummary = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    let matchQuery = { year: currentYear };
    if (req.user.role === 'Barber') {
      matchQuery.barber = req.user._id;
    }

    const summary = await Wage.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          totalEarnings: { $sum: '$totalEarning' },
          totalCommission: { $sum: '$commissionEarned' },
          totalServices: { $sum: 1 },
          totalServiceAmount: { $sum: '$serviceAmount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createWageRecord = async (req, res) => {
  try {
    const { barber, appointment, service, date, serviceAmount, tips } = req.body;

    const barberDoc = await User.findById(barber);
    if (!barberDoc) {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    const commissionRate = barberDoc.commissionRate;
    const commissionEarned = (serviceAmount * commissionRate) / 100;
    const totalEarning = commissionEarned + (tips || 0);

    const dateObj = new Date(date);

    const wage = await Wage.create({
      barber,
      appointment,
      service,
      date,
      serviceAmount,
      commissionRate,
      commissionEarned,
      tips: tips || 0,
      totalEarning,
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
    });

    const populated = await Wage.findById(wage._id)
      .populate('barber', 'name email commissionRate')
      .populate('service', 'name price');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateWageStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const wage = await Wage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('barber', 'name email');

    if (!wage) {
      return res.status(404).json({ success: false, message: 'Wage record not found' });
    }

    res.json({ success: true, data: wage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBarberEarnings = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { month, year } = req.query;
    const query = { barber: barberId };

    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    const wages = await Wage.find(query)
      .populate('service', 'name price')
      .sort({ date: -1 });

    const totalEarnings = wages.reduce((sum, w) => sum + w.totalEarning, 0);
    const totalCommission = wages.reduce((sum, w) => sum + w.commissionEarned, 0);

    res.json({
      success: true,
      data: wages,
      summary: { totalEarnings, totalCommission, totalServices: wages.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCommissionRate = async (req, res) => {
  try {
    const { commissionRate } = req.body;
    const { barberId } = req.params;

    const barber = await User.findByIdAndUpdate(
      barberId,
      { commissionRate },
      { new: true }
    ).select('-password');

    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }

    res.json({ success: true, data: barber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWageRecords,
  getMyEarnings,
  getMonthlySummary,
  createWageRecord,
  updateWageStatus,
  getBarberEarnings,
  updateCommissionRate,
};
