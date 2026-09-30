const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Shampoo', 'Hair Wax', 'Hair Color', 'Face Cream', 'Gel', 'Oil', 'Razor', 'Towel', 'Cape', 'Scissors', 'Other'],
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
  },
  minimumStock: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
  },
  unit: {
    type: String,
    default: 'pieces',
    enum: ['pieces', 'bottles', 'tubes', 'packets', 'liters', 'kg'],
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  supplier: {
    name: { type: String, default: '' },
    contact: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  lastRestocked: {
    type: Date,
  },
  isLowStock: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

inventorySchema.pre('save', function (next) {
  this.isLowStock = this.currentStock < this.minimumStock;
  next();
});

inventorySchema.index({ category: 1, isLowStock: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
