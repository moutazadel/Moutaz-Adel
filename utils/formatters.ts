export const formatCurrency = (amount: number, locale: string = 'ar-EG', currency: string = 'EGP') => {
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency, 
    minimumFractionDigits: 2,
    currencyDisplay: 'code'
  }).format(amount);
};