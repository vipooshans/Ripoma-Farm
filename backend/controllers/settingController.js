import Setting from '../models/Setting.js';
import { jsonDb } from '../utils/jsonDb.js';

// @desc    Get global settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res) => {
  try {
    let settings = null;
    if (global.dbConnected) {
      settings = await Setting.findOne({ key: 'global_settings' });
      if (!settings) {
        settings = await Setting.create({ key: 'global_settings' });
      }
    } else {
      settings = jsonDb.findOne('settings', s => s.key === 'global_settings');
      if (!settings) {
        settings = jsonDb.create('settings', { key: 'global_settings' });
      }
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  const { companyName, contactEmail, contactPhone, address, taxRate, shippingFee, stripeEnabled, paypalEnabled, cashOnDeliveryEnabled, bankName, bankAccountName, bankAccountNumber, whatsappNumber } = req.body;

  try {
    let updated = null;
    if (global.dbConnected) {
      let settings = await Setting.findOne({ key: 'global_settings' });
      if (!settings) {
        settings = new Setting({ key: 'global_settings' });
      }

      settings.companyName = companyName || settings.companyName;
      settings.contactEmail = contactEmail || settings.contactEmail;
      settings.contactPhone = contactPhone || settings.contactPhone;
      settings.address = address || settings.address;
      if (taxRate !== undefined) settings.taxRate = Number(taxRate);
      if (shippingFee !== undefined) settings.shippingFee = Number(shippingFee);
      if (stripeEnabled !== undefined) settings.stripeEnabled = stripeEnabled;
      if (paypalEnabled !== undefined) settings.paypalEnabled = paypalEnabled;
      if (cashOnDeliveryEnabled !== undefined) settings.cashOnDeliveryEnabled = cashOnDeliveryEnabled;
      if (bankName !== undefined) settings.bankName = bankName;
      if (bankAccountName !== undefined) settings.bankAccountName = bankAccountName;
      if (bankAccountNumber !== undefined) settings.bankAccountNumber = bankAccountNumber;
      if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber;

      updated = await settings.save();
    } else {
      let settings = jsonDb.findOne('settings', s => s.key === 'global_settings');
      if (!settings) {
        settings = jsonDb.create('settings', { key: 'global_settings' });
      }

      updated = jsonDb.findByIdAndUpdate('settings', settings._id, {
        companyName: companyName || settings.companyName,
        contactEmail: contactEmail || settings.contactEmail,
        contactPhone: contactPhone || settings.contactPhone,
        address: address || settings.address,
        taxRate: taxRate !== undefined ? Number(taxRate) : settings.taxRate,
        shippingFee: shippingFee !== undefined ? Number(shippingFee) : settings.shippingFee,
        stripeEnabled: stripeEnabled !== undefined ? stripeEnabled : settings.stripeEnabled,
        paypalEnabled: paypalEnabled !== undefined ? paypalEnabled : settings.paypalEnabled,
        cashOnDeliveryEnabled: cashOnDeliveryEnabled !== undefined ? cashOnDeliveryEnabled : settings.cashOnDeliveryEnabled,
        bankName: bankName !== undefined ? bankName : (settings.bankName || "People's Bank"),
        bankAccountName: bankAccountName !== undefined ? bankAccountName : (settings.bankAccountName || 'RIPOMA GLOBAL TRADIN'),
        bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : (settings.bankAccountNumber || '255100110082556'),
        whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : (settings.whatsappNumber || '0772078909'),
      });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
