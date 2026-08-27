import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type MarketBusiness = {
  country: string;
  country_code?: string | null;
  admin_area?: string | null;
  region?: string | null;
  locality?: string | null;
  city?: string | null;
  category: string;
  currency?: string | null;
  timezone?: string | null;
  locale?: string | null;
};

export async function syncMarketForBusiness(business: MarketBusiness) {
  const admin = createSupabaseAdminClient();
  const countryCode = (business.country_code || '').toUpperCase();
  const adminArea = business.admin_area || business.region || '';
  const locality = business.locality || business.city || '';

  if (!countryCode || !locality || !business.category) return;

  await admin.from('markets').upsert(
    {
      country: business.country,
      country_code: countryCode,
      admin_area: adminArea,
      locality,
      category: business.category,
      currency: (business.currency || 'usd').toLowerCase(),
      timezone: business.timezone || null,
      locale: business.locale || null,
      is_active: true,
    },
    { onConflict: 'country_code,admin_area,locality,category' }
  );
}
