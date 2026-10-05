export const CURRENCY_CODE = 'LKR';
export const USD_TO_LKR_RATE = 300;

const amountFormatter = new Intl.NumberFormat('en-LK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPrice = (amount) => `${CURRENCY_CODE} ${amountFormatter.format(Number(amount) || 0)}`;

export const usdToLkr = (amount) => Math.round((Number(amount) || 0) * USD_TO_LKR_RATE * 100) / 100;

const convertFields = (doc, fields) => {
  const converted = { ...doc };
  for (const field of fields) {
    if (typeof converted[field] === 'number') converted[field] = usdToLkr(converted[field]);
  }
  return converted;
};

const convertLines = (lines) => (lines || []).map(line => convertFields(line, ['price', 'costPrice']));

export const productToLkr = (product) => ({
  ...convertFields(product, ['basePrice', 'costPrice']),
  variants: convertLines(product.variants),
});

export const orderToLkr = (order) => ({
  ...convertFields(order, ['subtotal', 'shippingFee', 'tax', 'total']),
  items: convertLines(order.items),
});

export const transactionToLkr = (transaction) => convertFields(transaction, ['amount', 'costOfGoods']);

export const workerToLkr = (worker) => convertFields(worker, ['hourlyRate']);

export const settingsToLkr = (settings) => ({
  ...convertFields(settings, ['shippingFee']),
  currency: CURRENCY_CODE,
});
