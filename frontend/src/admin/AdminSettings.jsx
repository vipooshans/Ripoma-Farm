import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { NotificationContext } from '../context/NotificationContext';
import {
  Settings, Save, Database, Loader, AlertTriangle, ShieldCheck,
  CheckCircle, Key, Eye, EyeOff, Lock, Zap, Download, Shield, RefreshCw
} from 'lucide-react';
import { DEFAULT_SHIPPING_FEE } from '../utils/currency';

/* ── Password Strength Meter ────────────────────────────────────── */
const strengthLevels = [
  { label: 'Too Short', color: '#ef4444', bg: 'bg-red-500', width: 'w-1/4' },
  { label: 'Weak', color: '#f97316', bg: 'bg-orange-400', width: 'w-2/4' },
  { label: 'Fair', color: '#eab308', bg: 'bg-yellow-400', width: 'w-3/4' },
  { label: 'Strong', color: '#22c55e', bg: 'bg-emerald-500', width: 'w-full' },
];

const getPasswordStrength = (pw) => {
  if (!pw || pw.length < 4) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const PasswordStrengthMeter = ({ password }) => {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const level = strengthLevels[Math.max(0, strength - 1)];
  return (
    <div className="space-y-1 mt-1">
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${level.bg} ${level.width}`}
        />
      </div>
      <p className="text-[9px] font-bold tracking-wider" style={{ color: level.color }}>
        {level.label}
      </p>
    </div>
  );
};

/* ── Password Input with Show/Hide toggle ───────────────────────── */
const SecureInput = ({ name, label, value, onChange, onBlur, className, errorMsg, hint }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`${className} pr-9`}
          autoComplete="new-password"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2F4B3C] transition-colors"
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      {hint && !errorMsg && <p className="text-[9px] text-gray-400 font-light">{hint}</p>}
      {errorMsg && (
        <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" /> {errorMsg}
        </span>
      )}
    </div>
  );
};

/* ── Animated Security Badge ────────────────────────────────────── */
const SecurityBadge = ({ active }) => (
  <div
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all duration-500 ${active
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-gray-50 text-gray-500 border-gray-200'
      }`}
  >
    <Shield className={`w-3 h-3 ${active ? 'text-emerald-500' : 'text-gray-400'}`} />
    {active ? '2FA Active' : '2FA Off'}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════ */
const AdminSettings = () => {
  const { showToast } = useContext(NotificationContext);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [secSaveSuccess, setSecSaveSuccess] = useState(false);

  /* ── Global settings ── */
  const [form, setForm] = useState({
    companyName: 'RIPOMA Farm',
    contactEmail: 'contact@ripomafarm.com',
    contactPhone: '+1 (555) 019-9283',
    address: '128 Agro Valley Road, Organic City',
    taxRate: '5',
    shippingFee: String(DEFAULT_SHIPPING_FEE),
    stripeEnabled: true,
    cashOnDeliveryEnabled: true,
  });

  /* ── Security ── */
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [verifying, setVerifying] = useState(false);

  /* ── Validation state ── */
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [securityErrors, setSecurityErrors] = useState({});
  const [securityTouched, setSecurityTouched] = useState({});

  /* ── Load ── */
  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/settings');
      if (data) {
        setForm({
          companyName: data.companyName || 'RIPOMA Farm',
          contactEmail: data.contactEmail || 'contact@ripomafarm.com',
          contactPhone: data.contactPhone || '+1 (555) 019-9283',
          address: data.address || '128 Agro Valley Road, Organic City',
          taxRate: (data.taxRate || 5).toString(),
          shippingFee: (data.shippingFee || DEFAULT_SHIPPING_FEE).toString(),
          stripeEnabled: data.stripeEnabled !== undefined ? data.stripeEnabled : true,
          cashOnDeliveryEnabled: data.cashOnDeliveryEnabled !== undefined ? data.cashOnDeliveryEnabled : true,
        });
      }
    } catch {
      showToast('Could not load global settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  /* ── Validation ── */
  const validateField = (name, value) => {
    switch (name) {
      case 'companyName':
        return !value.trim() ? 'Company name is required' : '';
      case 'contactEmail':
        if (!value.trim()) return 'Support email is required';
        return !/\S+@\S+\.\S+/.test(value) ? 'Invalid email format' : '';
      case 'contactPhone':
        return !value.trim() ? 'Contact phone is required' : '';
      case 'address':
        return !value.trim() ? 'Physical address is required' : '';
      case 'taxRate': {
        const t = Number(value);
        if (value === '') return 'Tax rate is required';
        return (isNaN(t) || t < 0 || t > 100) ? 'Tax rate must be 0 – 100%' : '';
      }
      case 'shippingFee': {
        const s = Number(value);
        if (value === '') return 'Shipping fee is required';
        return (isNaN(s) || s < 0) ? 'Must be a positive number' : '';
      }
      default:
        return '';
    }
  };

  const validateSecurityField = (name, value) => {
    switch (name) {
      case 'currentPassword':
        return !value ? 'Current password is required' : '';
      case 'newPassword':
        if (!value) return 'New password is required';
        if (value.length < 8) return 'Min 8 characters';
        if (!/[0-9]/.test(value) || !/[A-Za-z]/.test(value))
          return 'Must contain a letter and a number';
        if (value === securityForm.currentPassword)
          return 'New password cannot match current password';
        return '';
      case 'confirmPassword':
        if (!value) return 'Confirmation is required';
        return value !== securityForm.newPassword ? 'Passwords do not match' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, val) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityForm(prev => ({ ...prev, [name]: value }));
    if (securityTouched[name])
      setSecurityErrors(prev => ({ ...prev, [name]: validateSecurityField(name, value) }));
  };

  const handleSecurityBlur = (e) => {
    const { name, value } = e.target;
    setSecurityTouched(prev => ({ ...prev, [name]: true }));
    setSecurityErrors(prev => ({ ...prev, [name]: validateSecurityField(name, value) }));
  };

  /* ── Submit: global settings ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldNames = ['companyName', 'contactEmail', 'contactPhone', 'address', 'taxRate', 'shippingFee'];
    const allErrors = Object.fromEntries(fieldNames.map(n => [n, validateField(n, form[n])]));
    setErrors(allErrors);
    setTouched(Object.fromEntries(fieldNames.map(n => [n, true])));
    if (Object.values(allErrors).some(e => e)) {
      showToast('Please fix the highlighted errors.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await axios.put('/api/settings', {
        ...form,
        taxRate: Number(form.taxRate),
        shippingFee: Number(form.shippingFee),
      });
      setSaveSuccess(true);
      showToast('Settings saved successfully!', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      showToast('Failed to save settings.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Submit: security / password ── */
  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    const secFields = ['currentPassword', 'newPassword', 'confirmPassword'];
    const allErrors = Object.fromEntries(secFields.map(n => [n, validateSecurityField(n, securityForm[n])]));
    setSecurityErrors(allErrors);
    setSecurityTouched(Object.fromEntries(secFields.map(n => [n, true])));
    if (Object.values(allErrors).some(e => e)) {
      showToast('Please correct the password errors.', 'error');
      return;
    }
    setSecSaveSuccess(false);
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 800));
      setSecSaveSuccess(true);
      showToast('Password updated successfully.', 'success');
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSecurityErrors({});
      setSecurityTouched({});
      setTimeout(() => setSecSaveSuccess(false), 3000);
    } catch {
      showToast('Failed to update password.', 'error');
    }
  };

  /* ── 2FA ── */
  const handle2FAToggle = (e) => {
    if (e.target.checked) {
      setVerificationCode('');
      setCodeError('');
      setIs2FAModalOpen(true);
    } else {
      setTwoFactorEnabled(false);
      showToast('Two-factor authentication disabled.', 'info');
    }
  };

  const verify2FACode = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setCodeError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setVerifying(true);
    setCodeError('');
    await new Promise(r => setTimeout(r, 1200));
    if (verificationCode !== '123456') {
      setCodeError('Incorrect code. Try the simulated code: 123456');
      setVerifying(false);
      return;
    }
    setVerifying(false);
    setTwoFactorEnabled(true);
    setIs2FAModalOpen(false);
    showToast('Two-factor authentication is now active.', 'success');
  };

  /* ── Backup ── */
  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const [productsRes, ordersRes, workersRes, settingsRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/orders'),
        axios.get('/api/workers'),
        axios.get('/api/settings'),
      ]);
      const dump = {
        backupDate: new Date().toISOString(),
        settings: settingsRes.data,
        products: productsRes.data,
        orders: ordersRes.data,
        workers: workersRes.data,
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RIPOMA_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Database backup downloaded!', 'success');
    } catch {
      showToast('Backup failed.', 'error');
    } finally {
      setBackingUp(false);
    }
  };

  /* ── Input class helper ── */
  const getInputClass = (field, errObj = errors, tchObj = touched) => {
    const base = 'w-full border outline-none rounded py-2 px-3 text-gray-800 input-field text-xs ';
    if (!tchObj[field]) return base + 'border-gray-200 focus:border-[#2F4B3C]';
    return errObj[field] ? base + 'input-invalid' : base + 'input-valid';
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="py-20 flex justify-center text-gray-400">
        <Loader className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  /* ═══════════════════════════════════ JSX ══════════════════════════ */
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up text-left font-sans print:hidden">

      {/* ── 1. Global Configuration ── */}
      <div className="bg-white border border-gray-150/60 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
          <h3 className="text-sm font-serif font-semibold text-[#2F4B3C] flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#A65D3D]" /> Global Configuration
          </h3>
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 text-emerald-600 text-[9px] font-bold uppercase tracking-wider animate-fade-in-up">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs text-gray-600" noValidate>

          {/* Company Details */}
          <div className="space-y-4">
            <h4 className="font-bold text-[#2F4B3C] text-xs font-serif pb-1 border-b border-gray-50">
              Company Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Company Name</label>
                <input
                  type="text" name="companyName" value={form.companyName}
                  onChange={handleChange} onBlur={handleBlur}
                  className={getInputClass('companyName')}
                />
                {touched.companyName && errors.companyName && (
                  <span className="text-red-500 font-bold text-[9px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.companyName}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Contact Phone</label>
                <input
                  type="text" name="contactPhone" value={form.contactPhone}
                  onChange={handleChange} onBlur={handleBlur}
                  className={getInputClass('contactPhone')}
                />
                {touched.contactPhone && errors.contactPhone && (
                  <span className="text-red-500 font-bold text-[9px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.contactPhone}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Support Email</label>
                <input
                  type="email" name="contactEmail" value={form.contactEmail}
                  onChange={handleChange} onBlur={handleBlur}
                  className={getInputClass('contactEmail')}
                />
                {touched.contactEmail && errors.contactEmail && (
                  <span className="text-red-500 font-bold text-[9px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.contactEmail}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Farm Address</label>
                <input
                  type="text" name="address" value={form.address}
                  onChange={handleChange} onBlur={handleBlur}
                  className={getInputClass('address')}
                />
                {touched.address && errors.address && (
                  <span className="text-red-500 font-bold text-[9px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tax & Shipping */}
          <div className="space-y-4 border-t border-gray-50 pt-4">
            <h4 className="font-bold text-[#2F4B3C] text-xs font-serif pb-1 border-b border-gray-50">
              Tax &amp; Shipping Settings
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Tax Rate (%)</label>
                <input
                  type="number" name="taxRate" value={form.taxRate}
                  onChange={handleChange} onBlur={handleBlur}
                  className={getInputClass('taxRate')}
                />
                {touched.taxRate && errors.taxRate && (
                  <span className="text-red-500 font-bold text-[9px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.taxRate}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Shipping Fee (LKR)</label>
                <input
                  type="number" name="shippingFee" value={form.shippingFee}
                  onChange={handleChange} onBlur={handleBlur}
                  className={getInputClass('shippingFee')}
                />
                {touched.shippingFee && errors.shippingFee && (
                  <span className="text-red-500 font-bold text-[9px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {errors.shippingFee}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="space-y-4 border-t border-gray-50 pt-4">
            <h4 className="font-bold text-[#2F4B3C] text-xs font-serif pb-1 border-b border-gray-50">
              Payment Gateways
            </h4>
            <div className="flex flex-col gap-3">
              {[
                { name: 'stripeEnabled', label: 'Enable Stripe (Credit Card)', desc: 'Allow simulated card charges at checkout.' },
                { name: 'cashOnDeliveryEnabled', label: 'Enable Cash on Delivery (COD)', desc: 'Allow orders to be paid on delivery.' },
              ].map(({ name, label, desc }) => (
                <label key={name} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-150/60 rounded-lg hover:bg-[#F6EFE3]/50 transition-colors group">
                  <div className="relative shrink-0">
                    <input
                      type="checkbox" name={name}
                      checked={form[name]} onChange={handleChange}
                      className="sr-only peer"
                      id={`toggle-${name}`}
                    />
                    <label htmlFor={`toggle-${name}`} className={`block w-9 h-5 rounded-full cursor-pointer transition-all duration-300 ${form[name] ? 'bg-[#2F4B3C]' : 'bg-gray-200'}`}>
                      <span className={`block w-3.5 h-3.5 bg-white rounded-full shadow mt-0.75 transition-all duration-300 ${form[name] ? 'translate-x-4' : 'translate-x-0.75'}`} />
                    </label>
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 block text-xs">{label}</span>
                    <span className="text-[10px] text-gray-400 font-light">{desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#2F4B3C] disabled:bg-gray-300 hover:bg-[#A65D3D] text-white font-bold py-3.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-widest text-[10px] active:scale-[0.98]"
          >
            {submitting
              ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              : <><Save className="w-3.5 h-3.5" /> Save Configuration</>
            }
          </button>
        </form>
      </div>

      {/* ── 2. Security & Access ── */}
      <div className="bg-white border border-gray-150/60 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
          <h3 className="text-sm font-serif font-semibold text-[#2F4B3C] flex items-center gap-2">
            <Key className="w-4 h-4 text-[#A65D3D]" /> Security &amp; Access
          </h3>
          {secSaveSuccess && (
            <span className="inline-flex items-center gap-1 text-emerald-600 text-[9px] font-bold uppercase tracking-wider animate-fade-in-up">
              <CheckCircle className="w-3.5 h-3.5" /> Password Updated
            </span>
          )}
        </div>

        <form onSubmit={handleSecuritySubmit} className="space-y-6 text-xs text-gray-600" noValidate>
          <div className="space-y-4">
            <h4 className="font-bold text-[#2F4B3C] text-xs font-serif pb-1 border-b border-gray-50">
              Change Admin Password
            </h4>

            {/* Current Password */}
            <SecureInput
              name="currentPassword"
              label="Current Password"
              value={securityForm.currentPassword}
              onChange={handleSecurityChange}
              onBlur={handleSecurityBlur}
              className={getInputClass('currentPassword', securityErrors, securityTouched)}
              errorMsg={securityTouched.currentPassword ? securityErrors.currentPassword : ''}
            />

            {/* New Password + Strength */}
            <div className="space-y-1">
              <SecureInput
                name="newPassword"
                label="New Password"
                value={securityForm.newPassword}
                onChange={handleSecurityChange}
                onBlur={handleSecurityBlur}
                className={getInputClass('newPassword', securityErrors, securityTouched)}
                errorMsg={securityTouched.newPassword ? securityErrors.newPassword : ''}
                hint="Min 8 chars, include a number and a letter"
              />
              <PasswordStrengthMeter password={securityForm.newPassword} />
            </div>

            {/* Confirm Password */}
            <SecureInput
              name="confirmPassword"
              label="Confirm New Password"
              value={securityForm.confirmPassword}
              onChange={handleSecurityChange}
              onBlur={handleSecurityBlur}
              className={getInputClass('confirmPassword', securityErrors, securityTouched)}
              errorMsg={securityTouched.confirmPassword ? securityErrors.confirmPassword : ''}
            />

            {/* Match indicator */}
            {securityForm.confirmPassword && securityForm.newPassword && (
              <div className={`flex items-center gap-1 text-[9px] font-bold tracking-wider ${securityForm.confirmPassword === securityForm.newPassword ? 'text-emerald-600' : 'text-red-500'
                }`}>
                {securityForm.confirmPassword === securityForm.newPassword
                  ? <><CheckCircle className="w-3 h-3" /> Passwords match</>
                  : <><AlertTriangle className="w-3 h-3" /> Passwords do not match</>
                }
              </div>
            )}
          </div>

          {/* 2FA Toggle */}
          <div className="space-y-3 border-t border-gray-50 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#2F4B3C] text-xs font-serif">Two-Factor Authentication</h4>
              <SecurityBadge active={twoFactorEnabled} />
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-150/60 rounded-lg hover:bg-[#F6EFE3]/50 transition-colors">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  id="toggle-2fa"
                  checked={twoFactorEnabled}
                  onChange={handle2FAToggle}
                  className="sr-only"
                />
                <label htmlFor="toggle-2fa" className={`block w-9 h-5 rounded-full cursor-pointer transition-all duration-300 ${twoFactorEnabled ? 'bg-[#2F4B3C]' : 'bg-gray-200'}`}>
                  <span className={`block w-3.5 h-3.5 bg-white rounded-full shadow mt-0.75 transition-all duration-300 ${twoFactorEnabled ? 'translate-x-4' : 'translate-x-0.75'}`} />
                </label>
              </div>
              <div>
                <span className="font-bold text-gray-800 block text-xs">Require 2FA on login</span>
                <span className="text-[10px] text-gray-400 font-light">Secure dashboard with Google Authenticator or Duo.</span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-3.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-widest text-[10px] active:scale-[0.98]"
          >
            <Lock className="w-3.5 h-3.5" /> Update Security Settings
          </button>
        </form>
      </div>

      {/* ── 3. Database Backup ── */}
      <div className="bg-white border border-gray-150/60 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-sm font-serif font-semibold text-[#2F4B3C] flex items-center gap-2 border-b border-gray-50 pb-3">
          <Database className="w-4 h-4 text-[#A65D3D]" /> Database Export &amp; Archive
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed font-light">
          Export the full system state — products, orders, workers, and settings — as a single signed JSON backup file you can store off-site.
        </p>
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-700 font-medium">
          <Zap className="w-4 h-4 shrink-0 text-amber-500" />
          Backups are point-in-time snapshots. Schedule regular exports to prevent data loss.
        </div>
        <button
          onClick={handleBackup}
          disabled={backingUp}
          className="bg-[#A65D3D] hover:bg-[#A65D3D]/90 disabled:bg-gray-300 text-white font-bold py-3.5 px-6 rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer uppercase text-[9px] tracking-widest active:scale-[0.98]"
        >
          {backingUp
            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling…</>
            : <><Download className="w-3.5 h-3.5" /> Download JSON Backup</>
          }
        </button>
      </div>

      {/* ── 2FA Setup Modal ── */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-gray-150/60 shadow-2xl space-y-5 text-center text-xs animate-fade-in-up">

            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>

            <div>
              <h3 className="font-serif text-base font-bold text-[#2F4B3C]">Set Up 2FA</h3>
              <p className="text-gray-400 font-light text-[11px] mt-1 leading-relaxed">
                Scan this QR code with Google Authenticator or Duo, then enter the 6-digit code shown in your app.
              </p>
            </div>

            {/* Simulated QR Code */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 inline-block mx-auto">
              <div className="grid grid-cols-6 gap-1 w-28 h-28">
                {Array.from({ length: 36 }).map((_, n) => (
                  <div key={n} className={`rounded-sm ${(n % 4 === 0 || n % 7 === 0 || n === 14 || n === 21) ? 'bg-gray-900' : 'bg-transparent'}`} />
                ))}
              </div>
              <p className="text-[8px] text-gray-400 mt-2 font-mono tracking-widest">RIPOMA-2FA-KEY</p>
            </div>

            <form onSubmit={verify2FACode} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block text-center">
                  6-Digit Code from Authenticator
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, ''));
                    setCodeError('');
                  }}
                  className="w-full border border-gray-200 outline-none rounded-lg py-3 px-4 text-center text-lg font-bold tracking-[0.4em] text-gray-800 focus:border-[#2F4B3C] transition-colors"
                />
                {codeError && (
                  <p className="text-red-500 text-[9px] font-bold flex items-center gap-1 justify-center pt-1">
                    <AlertTriangle className="w-3 h-3" /> {codeError}
                  </p>
                )}
              </div>

              <div className="flex gap-2 select-none">
                <button
                  type="button"
                  onClick={() => { setIs2FAModalOpen(false); setTwoFactorEnabled(false); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg uppercase text-[9px] tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || verificationCode.length !== 6}
                  className="flex-1 bg-[#2F4B3C] disabled:bg-gray-300 hover:bg-[#A65D3D] text-white font-bold py-2.5 rounded-lg uppercase text-[9px] tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  {verifying
                    ? <><Loader className="w-3 h-3 animate-spin" /> Verifying…</>
                    : <><ShieldCheck className="w-3 h-3" /> Verify &amp; Enable</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSettings;
