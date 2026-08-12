export const formatCurrency = (amount, symbol = '₹') => {
  if (amount === undefined || amount === null || isNaN(amount)) return `${symbol}0.00`;
  const num = Number(amount);
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
