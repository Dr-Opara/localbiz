import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get('days') || 30), 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const admin = createSupabaseAdminClient();
  const { data: businesses, error: businessError } = await admin
    .from('businesses')
    .select('id,name,slug')
    .eq('owner_id', user.id);

  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 400 });
  const ids = (businesses ?? []).map((b) => b.id);
  if (!ids.length) return NextResponse.json({ days, totals: {}, businesses: [] });

  const { data: events, error } = await admin
    .from('business_events')
    .select('business_id,event_type,created_at')
    .in('business_id', ids)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const empty = () => ({ impressions: 0, profile_views: 0, website_clicks: 0, phone_clicks: 0 });
  const byBusiness = new Map<string, ReturnType<typeof empty>>();
  const totals = empty();

  for (const event of events ?? []) {
    if (!byBusiness.has(event.business_id)) byBusiness.set(event.business_id, empty());
    const bucket = byBusiness.get(event.business_id)!;
    if (event.event_type === 'impression') { bucket.impressions += 1; totals.impressions += 1; }
    if (event.event_type === 'profile_view') { bucket.profile_views += 1; totals.profile_views += 1; }
    if (event.event_type === 'website_click') { bucket.website_clicks += 1; totals.website_clicks += 1; }
    if (event.event_type === 'phone_click') { bucket.phone_clicks += 1; totals.phone_clicks += 1; }
  }

  return NextResponse.json({
    days,
    totals,
    businesses: (businesses ?? []).map((business) => ({
      ...business,
      metrics: byBusiness.get(business.id) ?? empty(),
    })),
  });
}
