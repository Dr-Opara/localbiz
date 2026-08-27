import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const appUrl = process.env.APP_URL || new URL(request.url).origin;
  return NextResponse.redirect(`${appUrl}/`);
}
