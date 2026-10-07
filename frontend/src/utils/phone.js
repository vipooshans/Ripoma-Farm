// Sri Lankan numbers: 9 national digits after the +94 country code or the 0 trunk prefix,
// e.g. mobile +94 77 123 4567 / 077 123 4567, landline +94 11 234 5678 / 011 234 5678.
export const PHONE_PLACEHOLDER = '077 123 4567';
export const PHONE_FORMAT_ERROR = 'Enter a Sri Lankan number, e.g. 077 123 4567 or +94 77 123 4567';

const groupNational = (national) =>
  [national.slice(0, 2), national.slice(2, 5), national.slice(5, 9)].filter(Boolean).join(' ');

const toNationalDigits = (input) => {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('94')) return digits.slice(2);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
};

export const isValidSriLankanPhone = (input) => {
  const value = String(input || '').trim();
  return /^\+?[\d\s()-]+$/.test(value) && /^[1-9]\d{8}$/.test(toNationalDigits(value));
};

// Canonical form stored with orders and profiles: +94 77 123 4567
export const normalizeSriLankanPhone = (input) =>
  isValidSriLankanPhone(input) ? `+94 ${groupNational(toNationalDigits(input))}` : String(input || '').trim();

// Live formatting while typing; keeps whichever prefix style (+94 or 0) the user started with.
export const formatSriLankanPhoneInput = (input) => {
  const raw = String(input || '');
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw.trim().startsWith('+') ? '+' : '';

  if (raw.trim().startsWith('+') || digits.startsWith('94')) {
    if (digits.length <= 2 || !digits.startsWith('94')) return `+${digits}`;
    return `+94 ${groupNational(digits.slice(2, 11))}`;
  }
  if (digits.startsWith('0')) {
    const national = digits.slice(1, 10);
    return national ? `0${groupNational(national)}` : '0';
  }
  return groupNational(digits.slice(0, 9));
};
