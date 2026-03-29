import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { userId, name, currency } = await request.json();

    // Check if this is the first user
    const { count, error: countError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (count === 0) {
      // Create company
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert([{ name: `${name}'s Company`, base_currency: currency }])
        .select()
        .single();

      if (companyError) {
        return NextResponse.json({ error: companyError.message }, { status: 500 });
      }

      // Create admin profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: userId,
          company_id: company.id,
          full_name: name,
          role: 'Admin'
        }]);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      return NextResponse.json({ message: 'Admin and Company created successfully' });
    } else {
      return NextResponse.json({ error: 'System already initialized. Users must be invited by Admin.' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
