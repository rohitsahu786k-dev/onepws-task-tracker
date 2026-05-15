export const formatCurrency = (value = 0, currency = 'INR', locale = 'en-IN') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value) || 0);

export default formatCurrency;
