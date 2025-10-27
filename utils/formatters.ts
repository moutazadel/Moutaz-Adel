export const formatCurrency = (amount: number, locale: string = 'ar-EG', currency: string = 'EGP') => {
  const numericAmount = (typeof amount === 'number' && !isNaN(amount)) ? amount : 0;
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency, 
    minimumFractionDigits: 2,
    currencyDisplay: 'code'
  }).format(numericAmount);
};