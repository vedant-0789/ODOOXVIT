import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET() {
  try {
    // 1. Fetch profiles
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role');

    if (profileErr) throw profileErr;

    // 2. Fetch auth.users to see if they've ever logged in (active)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authErr) throw authErr;

    const mergedUsers = profiles.map(p => {
      const authUser = authData.users.find(u => u.id === p.id);
      return {
        ...p,
        // If last_sign_in_at exists, they have successfully logged in before
        isActive: !!(authUser && authUser.last_sign_in_at)
      };
    });

    return NextResponse.json(mergedUsers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
