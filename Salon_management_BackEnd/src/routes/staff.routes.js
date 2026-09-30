const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/staff.controller');

router.get('/', protect, authorize('Admin', 'Receptionist'), getAllStaff);
router.get('/availability', protect, getStaffAvailability);
router.get('/time-off', protect, authorize('Admin', 'Receptionist'), getAllTimeOffs);
router.get('/my-time-off', protect, authorize('Barber'), getMyTimeOffs);
router.get('/:id', protect, getStaffById);

router.post('/', protect, authorize('Admin'), createStaff);
router.post('/time-off', protect, authorize('Barber'), requestTimeOff);

router.put('/:id', protect, authorize('Admin'), updateStaff);
router.put('/:id/shift', protect, authorize('Admin', 'Receptionist'), updateShift);
router.put('/time-off/:id', protect, authorize('Admin', 'Receptionist'), updateTimeOffStatus);

router.delete('/:id', protect, authorize('Admin'), deleteStaff);

module.exports = router;
