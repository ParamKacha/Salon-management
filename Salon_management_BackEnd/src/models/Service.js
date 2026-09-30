const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Haircut', 'Beard Styling', 'Hair Coloring', 'Facial', 'Spa', 'Massage', 'Manicure', 'Pedicure', 'Other'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 5,
  },
  image: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

serviceSchema.index({ category: 1, price: 1, duration: 1 });

module.exports = mongoose.model('Service', serviceSchema);
