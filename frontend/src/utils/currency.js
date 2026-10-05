export const CURRENCY_CODE = 'LKR';
export const FREE_DELIVERY_THRESHOLD = 15000;
export const DEFAULT_SHIPPING_FEE = 2550;
export const DEFAULT_TAX_RATE = 5;

const amountFormatter = new Intl.NumberFormat('en-LK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-LK', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatAmount = (amount) => amountFormatter.format(Number(amount) || 0);

export const formatCompactAmount = (amount) => compactFormatter.format(Number(amount) || 0);

export const formatPrice = (amount) => `${CURRENCY_CODE} ${formatAmount(amount)}`;
