const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getWageRecords,
  getMyEarnings,
  getMonthlySummary,
  createWageRecord,
  updateWageStatus,
  getBarberEarnings,
  updateCommissionRate,
} = require('../controllers/wage.controller');

router.get('/', protect, authorize('Admin'), getWageRecords);
router.get('/my-earnings', protect, authorize('Barber'), getMyEarnings);
router.get('/monthly-summary', protect, authorize('Admin', 'Barber'), getMonthlySummary);
router.get('/barber/:barberId', protect, authorize('Admin'), getBarberEarnings);

router.post('/', protect, authorize('Admin'), createWageRecord);
router.put('/:id/status', protect, authorize('Admin'), updateWageStatus);
router.put('/commission/:barberId', protect, authorize('Admin'), updateCommissionRate);

module.exports = router;
