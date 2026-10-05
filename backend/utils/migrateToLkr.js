import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Transaction from '../models/Transaction.js';
import Worker from '../models/Worker.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import {
  CURRENCY_CODE,
  formatPrice,
  orderToLkr,
  productToLkr,
  settingsToLkr,
  transactionToLkr,
  usdToLkr,
  workerToLkr,
} from './currency.js';

dotenv.config();

// One-time conversion of stored USD amounts to LKR. Refuses to run twice:
// the global settings document's `currency` field marks the store as converted.
const USD_AMOUNT_IN_TEXT = /\$(\d[\d,]*(?:\.\d+)?)/g;

const collections = [
  { name: 'products', model: Product, convert: productToLkr, fields: ['basePrice', 'costPrice', 'variants'] },
  { name: 'orders', model: Order, convert: orderToLkr, fields: ['subtotal', 'shippingFee', 'tax', 'total', 'items'] },
  { name: 'transactions', model: Transaction, convert: transactionToLkr, fields: ['amount', 'costOfGoods'] },
  { name: 'workers', model: Worker, convert: workerToLkr, fields: ['hourlyRate'] },
  { name: 'settings', model: Setting, convert: settingsToLkr, fields: ['shippingFee', 'currency'] },
];

await connectDB();
if (!global.dbConnected) {
  console.error('MongoDB is not connected; nothing to migrate.');
  process.exit(1);
}

const globalSettings = await Setting.findOne({ key: 'global_settings' }).lean();
if (globalSettings?.currency === CURRENCY_CODE && !process.argv.includes('--force')) {
  console.log(`Store is already marked as ${CURRENCY_CODE}; skipping. Pass --force to convert again.`);
  await mongoose.connection.close();
  process.exit(0);
}

const backup = {};
for (const { name, model } of collections) {
  backup[name] = await model.find({}).lean();
}
backup.notifications = await Notification.find({ message: { $regex: '\\$\\d' } }).lean();

const backupDir = path.join(process.cwd(), 'backups');
fs.mkdirSync(backupDir, { recursive: true });
const backupFile = path.join(backupDir, `pre-lkr-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
console.log(`Backup written to ${backupFile}`);

for (const { name, model, convert, fields } of collections) {
  const ops = backup[name].map(doc => {
    const converted = convert(doc);
    const $set = Object.fromEntries(fields.filter(f => f in converted).map(f => [f, converted[f]]));
    return { updateOne: { filter: { _id: doc._id }, update: { $set } } };
  });
  if (ops.length) await model.collection.bulkWrite(ops);
  console.log(`${name}: converted ${ops.length}`);
}

const noteOps = backup.notifications.map(n => ({
  updateOne: {
    filter: { _id: n._id },
    update: { $set: { message: n.message.replace(USD_AMOUNT_IN_TEXT, (_, amt) => formatPrice(usdToLkr(amt.replace(/,/g, '')))) } },
  },
}));
if (noteOps.length) await Notification.collection.bulkWrite(noteOps);
console.log(`notifications: rewrote ${noteOps.length}`);

if (!globalSettings) {
  await Setting.create({ key: 'global_settings', currency: CURRENCY_CODE });
  console.log('settings: created global_settings marked as LKR');
}

await mongoose.connection.close();
console.log(`✅ Store amounts converted to ${CURRENCY_CODE}.`);
process.exit(0);
