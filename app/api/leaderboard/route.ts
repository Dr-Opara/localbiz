import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const countryCode = (url.searchParams.get('country_code') || '').trim().toUpperCase();
  const country = (url.searchParams.get('country') || '').trim();
  const city = (url.searchParams.get('city') || '').trim();
  const region = (url.searchParams.get('region') || '').trim();
  const category = (url.searchParams.get('category') || '').trim();

  if ((!countryCode && !country) || !city || !category) {
    return NextResponse.json(
      { error: 'country_code or country, plus city and category, are required' },
      { status: 422 }
    );
  }

  const supabase = publicClient();

  let businessQuery = supabase
    .from('businesses')
    .select('id,name,slug,category,country,country_code,region,admin_area,city,locality,formatted_address,website,phone,rating,review_count,verification_status')
    .eq('is_active', true)
    .ilike('category', category)
    .or(`city.ilike.${city},locality.ilike.${city}`);

  businessQuery = countryCode
    ? businessQuery.eq('country_code', countryCode)
    : businessQuery.ilike('country', country);

  if (region) businessQuery = businessQuery.or(`region.ilike.${region},admin_area.ilike.${region}`);

  const { data: businesses, error: businessError } = await businessQuery.limit(200);
  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 400 });

  if (!businesses?.length) return NextResponse.json({ leaderboard: [] });

  const ids = businesses.map((b) => b.id);
  const now = new Date().toISOString();
  const { data: bids, error: bidError } = await supabase
    .from('bids')
    .select('id,business_id,amount_cents,currency,placed_at,expires_at')
    .in('business_id', ids)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('amount_cents', { ascending: false })
    .order('placed_at', { ascending: true });

  if (bidError) return NextResponse.json({ error: bidError.message }, { status: 400 });

  const bestBid = new Map<string, NonNullable<typeof bids>[number]>();
  for (const bid of bids ?? []) {
    if (!bestBid.has(bid.business_id)) bestBid.set(bid.business_id, bid);
  }

  const leaderboard = businesses
    .map((business) => ({ ...business, bid: bestBid.get(business.id) ?? null }))
    .filter((entry) => entry.bid)
    .sort((a, b) => {
      const amount = (b.bid?.amount_cents ?? 0) - (a.bid?.amount_cents ?? 0);
      if (amount !== 0) return amount;
      return new Date(a.bid!.placed_at).getTime() - new Date(b.bid!.placed_at).getTime();
    })
    .map((entry, index) => ({ rank: index + 1, ...entry }));

  return NextResponse.json({ leaderboard });
}
