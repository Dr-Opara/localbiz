import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from('markets').select('id').limit(1);
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      service: 'localbiz-api',
      database: 'reachable',
      payments: process.env.STRIPE_SECRET_KEY ? 'configured' : 'deferred',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ ok: false, service: 'localbiz-api', database: 'unreachable' }, { status: 503 });
  }
}
