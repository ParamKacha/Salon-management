const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCustomerDashboard,
  getBarberDashboard,
  getReceptionistDashboard,
} = require('../controllers/dashboard.controller');

router.get('/customer', protect, getCustomerDashboard);
router.get('/barber', protect, getBarberDashboard);
router.get('/receptionist', protect, getReceptionistDashboard);

module.exports = router;
