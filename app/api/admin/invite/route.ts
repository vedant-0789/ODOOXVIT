import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { email, name, role, managerId } = await request.json();

    // 1. Generate a random password
    const generatedPassword = Math.random().toString(36).slice(-10);

    // 2. Create the user explicitly with the password and bypass email confirmation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'User creation failed - no user returned' }, { status: 500 });
    }

    const { data: companies } = await supabaseAdmin.from('companies').select('id').limit(1);
    const companyId = companies?.[0]?.id;

    // 4. Create their profile in the profiles table
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

    // 5. Send Email via Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"ClaimOps Admin" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to ClaimOps! Your Account Details",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome, ${name}!</h2>
          <p>An administrator has created an account for you on ClaimOps.</p>
          <p>Your login details are below:</p>
          <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${generatedPassword}</p>
            <p><strong>Role:</strong> ${role}</p>
          </div>
          <p>You can log in immediately and securely reset your password from the dashboard.</p>
        </div>
      `,
    });

    return NextResponse.json({ 
      message: 'User created and email successfully sent.', 
      user: authData.user
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
