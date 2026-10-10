/**
 * Currency & Localization Utilities for Tamil Nadu (INR)
 */

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';
export const STATE_NAME = 'Tamil Nadu';
export const STATE_GST_CODE = '33'; // Official GST State Code for Tamil Nadu

/**
 * Formats a number into Indian Rupee format (e.g. ₹1,25,450.00)
 */
export function formatINR(amount: number | undefined | null, showDecimals: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }
  
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
    return `₹${formatted}`;
  } catch {
    return `₹${Number(amount).toFixed(showDecimals ? 2 : 0)}`;
  }
}

/**
 * Format large amounts in Lakhs or Crores (e.g. ₹15.5 Lakhs)
 */
export function formatINRLakhs(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return formatINR(amount, false);
}

/**
 * Standard GST tax split calculation for Tamil Nadu intra-state retail
 * Intra-state sales divide GST equally into CGST and SGST (State: Tamil Nadu)
 */
export function calculateGSTBreakdown(taxableAmount: number, taxRatePercent: number) {
  const totalTax = (taxableAmount * taxRatePercent) / 100;
  const halfRate = taxRatePercent / 2;
  const halfTax = totalTax / 2;
  return {
    totalTax,
    cgstRate: halfRate,
    cgstAmount: halfTax,
    sgstRate: halfRate,
    sgstAmount: halfTax,
    stateCode: STATE_GST_CODE,
    stateName: STATE_NAME,
  };
}
