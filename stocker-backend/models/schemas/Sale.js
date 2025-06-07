const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  saleNumber: {
    type: String,
    unique: true,
    required: true,
    default: () => `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    validate: {
      validator: function(v) {
        return v <= this.subtotal;
      },
      message: 'Discount cannot be greater than subtotal'
    }
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative'],
    validate: {
      validator: function(v) {
        return Math.abs((this.subtotal - this.discount + this.tax) - v) < 0.01;
      },
      message: 'Total must equal subtotal minus discount plus tax'
    }
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Mobile Payment', 'Bank Transfer'],
    default: 'Cash'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Completed'
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['Processing', 'Completed', 'Cancelled', 'Refunded'],
    default: 'Completed'
  },
  notes: {
    type: String,
    trim: true
  },
  refundReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
SaleSchema.index({ date: -1 });
SaleSchema.index({ 'items.product': 1 });
SaleSchema.index({ user: 1, date: -1 });
SaleSchema.index({ saleNumber: 1 }, { unique: true });

// Virtual for formatted date
SaleSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Virtual for total items count
SaleSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Pre-save middleware to validate totals
SaleSchema.pre('save', function(next) {
  // Calculate expected total
  const calculatedTotal = this.subtotal - this.discount + this.tax;
  if (Math.abs(calculatedTotal - this.total) > 0.01) { // Allow for small floating point differences
    next(new Error('Total amount does not match calculation'));
  }
  next();
});

// Method to generate receipt
SaleSchema.methods.generateReceipt = function() {
  return {
    saleNumber: this.saleNumber,
    date: this.formattedDate,
    items: this.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price.toFixed(2),
      total: item.total.toFixed(2)
    })),
    subtotal: this.subtotal.toFixed(2),
    discount: this.discount.toFixed(2),
    tax: this.tax.toFixed(2),
    total: this.total.toFixed(2),
    paymentMethod: this.paymentMethod
  };
};

// Static method to generate sales report
SaleSchema.statics.generateReport = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        status: 'Completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalTax: { $sum: '$tax' },
        totalDiscount: { $sum: '$discount' },
        count: { $sum: 1 },
        averageSale: { $avg: '$total' }
      }
    }
  ]);
};

module.exports = SaleSchema; 