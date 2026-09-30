const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServiceCategories,
} = require('../controllers/service.controller');

router.get('/', getAllServices);
router.get('/categories', getServiceCategories);
router.get('/:id', getServiceById);

router.post(
  '/',
  protect,
  authorize('Admin'),
  [
    body('name').notEmpty().withMessage('Service name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('duration').isNumeric().withMessage('Duration must be a number'),
  ],
  validate,
  createService
);

router.put('/:id', protect, authorize('Admin'), updateService);
router.delete('/:id', protect, authorize('Admin'), deleteService);

module.exports = router;
