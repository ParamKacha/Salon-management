const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getRevenueAnalytics,
  getUserGrowthAnalytics,
  getServicePopularity,
  getStaffPerformance,
  getOverviewStats,
  getMonthlyAppointments,
} = require('../controllers/analytics.controller');

router.get('/revenue', protect, authorize('Admin'), getRevenueAnalytics);
router.get('/user-growth', protect, authorize('Admin'), getUserGrowthAnalytics);
router.get('/service-popularity', protect, authorize('Admin'), getServicePopularity);
router.get('/staff-performance', protect, authorize('Admin'), getStaffPerformance);
router.get('/overview', protect, authorize('Admin'), getOverviewStats);
router.get('/monthly-appointments', protect, authorize('Admin'), getMonthlyAppointments);

module.exports = router;
