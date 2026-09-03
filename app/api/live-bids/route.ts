import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: bids, error: bidError } = await admin
    .from('bids')
    .select('id,business_id,amount_cents,currency,status,placed_at,expires_at,country,country_code,region,admin_area,city,locality,category')
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('amount_cents', { ascending: false })
    .order('placed_at', { ascending: true })
    .limit(100);

  if (bidError) return NextResponse.json({ error: bidError.message }, { status: 400 });
  if (!bids?.length) return NextResponse.json({ bids: [] });

  const businessIds = [...new Set(bids.map((bid) => bid.business_id))];
  const { data: businesses, error: businessError } = await admin
    .from('businesses')
    .select('id,name,slug,website,category,country,country_code,region,admin_area,city,locality,rating,review_count,verification_status,is_active')
    .in('id', businessIds)
    .eq('is_active', true);

  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 400 });

  const businessMap = new Map((businesses ?? []).map((business) => [business.id, business]));
  const rows = bids
    .map((bid) => {
      const business = businessMap.get(bid.business_id);
      if (!business) return null;
      return {
        id: bid.id,
        amount_cents: bid.amount_cents,
        currency: bid.currency,
        placed_at: bid.placed_at,
        expires_at: bid.expires_at,
        business,
        market: {
          country: bid.country || business.country,
          country_code: bid.country_code || business.country_code,
          region: bid.admin_area || bid.region || business.admin_area || business.region,
          city: bid.locality || bid.city || business.locality || business.city,
          category: bid.category || business.category,
        },
      };
    })
    .filter(Boolean);

  return NextResponse.json({ bids: rows });
}
