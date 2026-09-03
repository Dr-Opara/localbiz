import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const businessId = String(url.searchParams.get('business_id') || '');
  if (!businessId) return NextResponse.json({ error: 'business_id is required' }, { status: 422 });

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id,category,country,country_code,region,admin_area,city,locality,currency')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single();

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found or not owned by this account' }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const city = business.locality || business.city;
  const region = business.admin_area || business.region;

  let marketQuery = admin
    .from('businesses')
    .select('id')
    .eq('is_active', true)
    .ilike('category', business.category)
    .or(`city.ilike.${city},locality.ilike.${city}`);

  marketQuery = business.country_code
    ? marketQuery.eq('country_code', business.country_code)
    : marketQuery.ilike('country', business.country);

  if (region) marketQuery = marketQuery.or(`region.ilike.${region},admin_area.ilike.${region}`);

  const { data: marketBusinesses, error: marketError } = await marketQuery.limit(500);
  if (marketError) return NextResponse.json({ error: marketError.message }, { status: 400 });

  const ids = (marketBusinesses ?? []).map((entry) => entry.id);
  if (!ids.length) {
    return NextResponse.json({ highest_bid_cents: 0, minimum_bid_cents: 100, currency: business.currency || 'usd' });
  }

  const now = new Date().toISOString();
  const { data: topBid, error: bidError } = await admin
    .from('bids')
    .select('amount_cents,currency')
    .in('business_id', ids)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('amount_cents', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (bidError) return NextResponse.json({ error: bidError.message }, { status: 400 });

  const highest = Number(topBid?.amount_cents || 0);
  return NextResponse.json({
    highest_bid_cents: highest,
    minimum_bid_cents: Math.max(100, highest),
    currency: String(topBid?.currency || business.currency || 'usd').toLowerCase(),
  });
}
