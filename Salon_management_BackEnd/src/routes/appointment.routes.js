const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/appointment.controller');

router.get('/available-slots', protect, getAvailableSlots);
router.get('/my', protect, getMyAppointments);
router.get('/barber', protect, authorize('Barber'), getBarberAppointments);
router.get('/', protect, authorize('Admin', 'Receptionist'), getAllAppointments);
router.get('/:id', protect, getAppointmentById);

router.post(
  '/',
  protect,
  [
    body('service').notEmpty().withMessage('Service is required'),
    body('barber').notEmpty().withMessage('Barber is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('timeSlot').notEmpty().withMessage('Time slot is required'),
  ],
  validate,
  createAppointment
);

router.put('/:id/status', protect, authorize('Admin', 'Receptionist', 'Barber'), updateAppointmentStatus);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/reschedule', protect, rescheduleAppointment);
router.put('/:id/assign', protect, authorize('Admin', 'Receptionist'), assignBarber);

module.exports = router;
