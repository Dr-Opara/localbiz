import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function publicClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error('Supabase public environment variables are not configured.');

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
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

  if (!businesses?.length) {
    return NextResponse.json({ market: { country_code: countryCode || null, country: country || null, city, region: region || null, category }, sponsored: [], organic: [], leaderboard: [] });
  }

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

  const sponsored = businesses
    .filter((business) => bestBid.has(business.id))
    .map((business) => ({ ...business, bid: bestBid.get(business.id)! }))
    .sort((a, b) => {
      const amount = b.bid.amount_cents - a.bid.amount_cents;
      if (amount !== 0) return amount;
      return new Date(a.bid.placed_at).getTime() - new Date(b.bid.placed_at).getTime();
    })
    .map((entry, index) => ({ sponsored_rank: index + 1, sponsored: true, ...entry }));

  const sponsoredIds = new Set(sponsored.map((entry) => entry.id));
  const organic = businesses
    .filter((business) => !sponsoredIds.has(business.id))
    .sort((a, b) => {
      const verified = Number(b.verification_status === 'verified') - Number(a.verification_status === 'verified');
      if (verified !== 0) return verified;
      const rating = Number(b.rating ?? 0) - Number(a.rating ?? 0);
      if (rating !== 0) return rating;
      const reviews = Number(b.review_count ?? 0) - Number(a.review_count ?? 0);
      if (reviews !== 0) return reviews;
      return a.name.localeCompare(b.name);
    })
    .map((entry, index) => ({ organic_rank: index + 1, sponsored: false, bid: null, ...entry }));

  const leaderboard = [
    ...sponsored.map((entry, index) => ({ position: index + 1, placement_type: 'sponsored' as const, ...entry })),
    ...organic.map((entry, index) => ({ position: sponsored.length + index + 1, placement_type: 'organic' as const, ...entry })),
  ];

  return NextResponse.json({
    market: { country_code: countryCode || null, country: country || null, city, region: region || null, category },
    disclosure: 'Sponsored positions are ordered by paid bid. Ratings and reviews are independent reputation signals.',
    sponsored,
    organic,
    leaderboard,
  });
}
