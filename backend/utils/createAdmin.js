import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Admin, { ADMIN_ROLES, DEFAULT_ROLE_PERMISSIONS } from '../models/Admin.js';
import { jsonDb } from './jsonDb.js';

dotenv.config();

// Usage: npm run create-admin -- <email> <password> [role] [name]
const [emailArg, password, role = 'super_admin', name = 'Administrator'] = process.argv.slice(2);

if (!emailArg || !password) {
  console.error('Usage: npm run create-admin -- <email> <password> [role] [name]');
  process.exit(1);
}
if (!ADMIN_ROLES.includes(role)) {
  console.error(`Invalid role "${role}". Valid roles: ${ADMIN_ROLES.join(', ')}`);
  process.exit(1);
}

const email = emailArg.toLowerCase().trim();
const fields = {
  name,
  role,
  permissions: DEFAULT_ROLE_PERMISSIONS[role],
  status: 'active',
  failedLoginAttempts: 0,
  lockoutUntil: null,
};

await connectDB();

if (global.dbConnected) {
  let admin = await Admin.findOne({ email });
  const existed = Boolean(admin);
  if (!admin) admin = new Admin({ email });
  Object.assign(admin, fields, { password });
  await admin.save();
  console.log(`✅ ${existed ? 'Updated' : 'Created'} ${role} account in MongoDB: ${email}`);
  await mongoose.connection.close();
} else {
  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
  const existing = jsonDb.findOne('admins', a => a.email?.toLowerCase() === email);
  if (existing) {
    jsonDb.findByIdAndUpdate('admins', existing._id, { ...fields, password: hashedPassword });
  } else {
    jsonDb.create('admins', {
      ...fields,
      email,
      password: hashedPassword,
      two_factor_enabled: true,
      two_factor_secret: 'RIPOMA-SECURE-2FA-FARM',
      loginHistory: [],
    });
  }
  console.log(`✅ ${existing ? 'Updated' : 'Created'} ${role} account in JSON store: ${email}`);
}

process.exit(0);
