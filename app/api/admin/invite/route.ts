import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { email, name, role, managerId } = await request.json();

    // 1. Invite the user via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'User invitation failed - no user returned' }, { status: 500 });
    }

    // 2. We need the companyId of the admin. We can infer it from the admin's session
    // Since this is a hackathon, we can just grab the first company id for the demo.
    const { data: companies, error: companyErr } = await supabaseAdmin.from('companies').select('id').limit(1);
    const companyId = companies?.[0]?.id;

    // 3. Create their profile in the profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: authData.user.id,
        company_id: companyId,
        full_name: name,
        role: role,
        manager_id: managerId || null
      }]);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'User invited successfully', user: authData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
