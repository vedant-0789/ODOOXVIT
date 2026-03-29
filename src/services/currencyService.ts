import { CurrencyConversionRequest, CurrencyConversionResult } from '../shared-types';

/**
 * Fetches real-time exchange rates and calculates the converted base amount.
 * Example: Employee submits 100 USD, company base is INR. 
 * Resolves the multiplier from Exchangerate API and calculates the actual base amount.
 */
export async function convertExpenseAmount(
  request: CurrencyConversionRequest
): Promise<CurrencyConversionResult> {
  const { submitted_amount, submitted_currency, company_base_currency } = request;

  // 1. If currencies map perfectly, no conversion is needed
  if (submitted_currency.toUpperCase() === company_base_currency.toUpperCase()) {
    return {
      converted_amount: submitted_amount,
      exchange_rate: 1,
    };
  }

  // 2. Fetch the conversion rates for the submitted base currency
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${submitted_currency.toUpperCase()}`);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates. Status: ${response.status}`);
    }

    const data = await response.json();
    const targetRate = data.rates[company_base_currency.toUpperCase()];

    if (!targetRate) {
        throw new Error(`Exchange rate not found for target base: ${company_base_currency}`);
    }

    // 3. Return the meticulously converted DTO
    return {
      converted_amount: Number((submitted_amount * targetRate).toFixed(2)),
      exchange_rate: targetRate,
    };
    
  } catch (error: any) {
    console.error("CurrencyService Error:", error.message);
    throw new Error(`Currency calculation failed: ${error.message}`);
  }
}
