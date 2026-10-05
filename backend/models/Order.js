import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false, // Allow guest checkout or anonymous if needed
  },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    variantName: { type: String, default: '' }, // e.g. "100g", "Tray"
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Price at time of order
    costPrice: { type: Number, required: true }, // For profit tracking
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  shippingFee: {
    type: Number,
    required: true,
    default: 0,
  },
  tax: {
    type: Number,
    required: true,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true, // Stripe, PayPal, Cash on Delivery, Card
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  invoiceNumber: {
    type: String,
    unique: true,
  },
  trackingNumber: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export default Order;
