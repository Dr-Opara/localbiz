import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const WINDOW_MS = 2 * 60 * 1000;

export async function GET() {
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { data, error } = await admin
    .from('audit_logs')
    .select('entity_id')
    .eq('action', 'site_presence')
    .gte('created_at', since)
    .limit(5000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const online = new Set((data || []).map((row) => row.entity_id).filter(Boolean)).size;
  return NextResponse.json({ online });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const visitorId = String(body.visitor_id || '').trim().slice(0, 120);
  if (!visitorId) return NextResponse.json({ error: 'visitor_id required' }, { status: 422 });

  const admin = createSupabaseAdminClient();
  await admin.from('audit_logs').insert({
    actor_id: null,
    action: 'site_presence',
    entity_type: 'visitor',
    entity_id: visitorId,
    metadata: { source: 'homepage' },
  });

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { data } = await admin
    .from('audit_logs')
    .select('entity_id')
    .eq('action', 'site_presence')
    .gte('created_at', since)
    .limit(5000);

  const online = new Set((data || []).map((row) => row.entity_id).filter(Boolean)).size;
  return NextResponse.json({ online });
}
