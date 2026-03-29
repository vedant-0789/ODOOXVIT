import { NextResponse } from 'next/server';
import { convertExpenseAmount } from '../../../../src/services/currencyService';
import { getAdminSupabase } from '../../../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { expense_id, target_currency } = await req.json();

    if (!expense_id) {
       return NextResponse.json({ error: 'Missing expense_id' }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // 1. Retrieve the original Expense context from the DB directly 
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select(`
         amount, 
         currency, 
         profiles (
            company_id
         )
      `)
      .eq('id', expense_id)
      .single();

    if (fetchError || !expense) {
        throw new Error(fetchError?.message || 'Expense not found');
    }

    // Extracting nested relation properly
    const companyId = (expense.profiles as any)?.company_id;
    let baseCur = target_currency;

    // 2. Fetch the Company baseline currency if a target wasn't explicitly passed
    if (!target_currency && companyId) {
       const { data: companyProfile } = await supabase
          .from('companies')
          .select('base_currency')
          .eq('id', companyId)
          .single();
       if (companyProfile?.base_currency) {
          baseCur = companyProfile.base_currency;
       }
    }

    // 3. Connect to ExchangeRate Engine API mathematically
    const result = await convertExpenseAmount({
       submitted_amount: expense.amount,
       submitted_currency: expense.currency,
       company_base_currency: baseCur || 'USD'
    });

    // 4. The requested logic says "Dynamically intercept and convert on the Manager review"
    // So we just return the values virtually, preventing mutating the original employee's submission!
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: any) {
    console.error("Currency Converter API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
