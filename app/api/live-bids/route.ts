import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const CONTINENTS: Record<string, string> = {
  US: 'North America', CA: 'North America', MX: 'North America', GT: 'North America', BZ: 'North America', HN: 'North America', SV: 'North America', NI: 'North America', CR: 'North America', PA: 'North America', CU: 'North America', JM: 'North America', HT: 'North America', DO: 'North America', BS: 'North America', BB: 'North America', TT: 'North America', PR: 'North America',
  NG: 'Africa', GH: 'Africa', ZA: 'Africa', KE: 'Africa', EG: 'Africa', MA: 'Africa', DZ: 'Africa', TN: 'Africa', ET: 'Africa', UG: 'Africa', TZ: 'Africa', RW: 'Africa', SN: 'Africa', CI: 'Africa', CM: 'Africa', AO: 'Africa', ZM: 'Africa', ZW: 'Africa', BW: 'Africa', NA: 'Africa', MZ: 'Africa',
  CN: 'Asia', JP: 'Asia', KR: 'Asia', IN: 'Asia', PK: 'Asia', BD: 'Asia', LK: 'Asia', NP: 'Asia', SG: 'Asia', MY: 'Asia', ID: 'Asia', PH: 'Asia', TH: 'Asia', VN: 'Asia', KH: 'Asia', MM: 'Asia', AE: 'Asia', SA: 'Asia', QA: 'Asia', KW: 'Asia', IL: 'Asia', TR: 'Asia', HK: 'Asia', TW: 'Asia',
  GB: 'Europe', IE: 'Europe', FR: 'Europe', DE: 'Europe', ES: 'Europe', PT: 'Europe', IT: 'Europe', NL: 'Europe', BE: 'Europe', LU: 'Europe', CH: 'Europe', AT: 'Europe', SE: 'Europe', NO: 'Europe', DK: 'Europe', FI: 'Europe', PL: 'Europe', CZ: 'Europe', SK: 'Europe', HU: 'Europe', RO: 'Europe', BG: 'Europe', GR: 'Europe', HR: 'Europe', SI: 'Europe', EE: 'Europe', LV: 'Europe', LT: 'Europe', IS: 'Europe', UA: 'Europe',
  BR: 'South America', AR: 'South America', CL: 'South America', CO: 'South America', PE: 'South America', EC: 'South America', VE: 'South America', BO: 'South America', PY: 'South America', UY: 'South America', GY: 'South America', SR: 'South America',
  AU: 'Oceania', NZ: 'Oceania', FJ: 'Oceania', PG: 'Oceania', WS: 'Oceania', TO: 'Oceania',
};

export async function GET(request: Request) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const viewerCountryCode = (request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || '').toUpperCase();

  const { data: bids, error: bidError } = await admin
    .from('bids')
    .select('id,business_id,amount_cents,currency,status,placed_at,expires_at,country,country_code,region,admin_area,city,locality,category')
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('amount_cents', { ascending: false })
    .order('placed_at', { ascending: true })
    .limit(100);

  if (bidError) return NextResponse.json({ error: bidError.message }, { status: 400 });
  if (!bids?.length) return NextResponse.json({ bids: [], viewer: { country_code: viewerCountryCode || null, continent: CONTINENTS[viewerCountryCode] || null } });

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
      const countryCode = (bid.country_code || business.country_code || '').toUpperCase();
      return {
        id: bid.id,
        amount_cents: bid.amount_cents,
        currency: bid.currency,
        placed_at: bid.placed_at,
        expires_at: bid.expires_at,
        business,
        market: {
          country: bid.country || business.country,
          country_code: countryCode || null,
          continent: CONTINENTS[countryCode] || 'Other',
          region: bid.admin_area || bid.region || business.admin_area || business.region,
          city: bid.locality || bid.city || business.locality || business.city,
          category: bid.category || business.category,
        },
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    bids: rows,
    viewer: {
      country_code: viewerCountryCode || null,
      continent: CONTINENTS[viewerCountryCode] || null,
    },
  });
}
