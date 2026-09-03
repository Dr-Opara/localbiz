import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const fullName = String(form.get('full_name') ?? '').trim();
  const url = new URL(request.url);

  if (!email || password.length < 8) {
    return NextResponse.redirect(new URL('/signup?error=Use%20a%20valid%20email%20and%20an%208%2B%20character%20password', url.origin), 303);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null },
      emailRedirectTo: `${url.origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(error.message)}`, url.origin), 303);
  }

  if (data.session) {
    return NextResponse.redirect(new URL('/dashboard', url.origin), 303);
  }

  return NextResponse.redirect(new URL('/login?message=Check%20your%20email%20to%20confirm%20your%20LocalBiz%20account', url.origin), 303);
}
