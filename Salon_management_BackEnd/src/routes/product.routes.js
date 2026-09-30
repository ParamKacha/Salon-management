const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  searchProducts,
} = require('../controllers/product.controller');

router.get('/', getAllProducts);
router.get('/categories', getProductCategories);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

router.post(
  '/',
  protect,
  authorize('Admin'),
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
  ],
  validate,
  createProduct
);

router.put('/:id', protect, authorize('Admin'), updateProduct);
router.delete('/:id', protect, authorize('Admin'), deleteProduct);

module.exports = router;
