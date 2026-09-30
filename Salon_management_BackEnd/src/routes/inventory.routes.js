const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockItems,
  restockItem,
  getInventoryCategories,
} = require('../controllers/inventory.controller');

router.get('/', protect, authorize('Admin'), getAllInventory);
router.get('/low-stock', protect, authorize('Admin'), getLowStockItems);
router.get('/categories', protect, authorize('Admin'), getInventoryCategories);
router.get('/:id', protect, authorize('Admin'), getInventoryById);

router.post(
  '/',
  protect,
  authorize('Admin'),
  [
    body('itemName').notEmpty().withMessage('Item name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('currentStock').isNumeric().withMessage('Current stock must be a number'),
    body('costPerUnit').isNumeric().withMessage('Cost per unit must be a number'),
  ],
  validate,
  createInventoryItem
);

router.put('/:id', protect, authorize('Admin'), updateInventoryItem);
router.put('/:id/restock', protect, authorize('Admin'), restockItem);
router.delete('/:id', protect, authorize('Admin'), deleteInventoryItem);

module.exports = router;
