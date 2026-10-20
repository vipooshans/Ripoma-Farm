import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true, // e.g. "global_settings"
  },
  companyName: {
    type: String,
    default: 'RIPOMA Farm',
  },
  contactEmail: {
    type: String,
    default: 'contact@ripomafarm.com',
  },
  contactPhone: {
    type: String,
    default: '+94 11 274 6622',
  },
  address: {
    type: String,
    default: '128 Agro Valley Road, Organic City',
  },
  taxRate: {
    type: Number,
    default: 5, // percentage
  },
  shippingFee: {
    type: Number,
    default: 2550, // currency value
  },
  currency: {
    type: String,
    default: 'LKR',
  },
  stripeEnabled: {
    type: Boolean,
    default: true,
  },
  paypalEnabled: {
    type: Boolean,
    default: false,
  },
  cashOnDeliveryEnabled: {
    type: Boolean,
    default: true,
  },
  bankName: {
    type: String,
    default: "People's Bank",
  },
  bankAccountName: {
    type: String,
    default: 'RIPOMA GLOBAL TRADIN',
  },
  bankAccountNumber: {
    type: String,
    default: '255100110082556',
  },
  whatsappNumber: {
    type: String,
    default: '0772078909',
  },
  heroSlogan: {
    type: String,
    default: "Farm Fresh Products Delivered With Quality You Can Trust",
  },
  heroSubtitle: {
    type: String,
    default: "Sourced with care, delivered fresh. Organic poultry, free-range eggs, and premium solar-dried fish.",
  },
  aboutUsSummary: {
    type: String,
    default: "RIPOMA Farm began with a commitment to clean, organic agriculture. We feed our chickens organic grains and solar-cure our fish to deliver premium quality.",
  },
  businessHours: {
    type: String,
    default: "Monday - Friday: 8 AM - 5 PM | Saturday: 9 AM - 2 PM",
  },
}, {
  timestamps: true,
});

const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
export default Setting;
