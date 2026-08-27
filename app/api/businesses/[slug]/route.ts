import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const supabase = createSupabaseAdminClient();

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id,name,slug,category,description,website,phone,email,country,country_code,region,admin_area,city,locality,postal_code,address_line1,address_line2,formatted_address,latitude,longitude,service_area,timezone,locale,currency,hours,services,rating,review_count,verification_status,is_active,created_at')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const [{ data: activeBid }, { data: reviews }] = await Promise.all([
    supabase
      .from('bids')
      .select('id,amount_cents,currency,country,city,category,placed_at,expires_at')
      .eq('business_id', business.id)
      .eq('status', 'active')
      .order('amount_cents', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('reviews')
      .select('id,reviewer_id,rating,title,body,created_at,updated_at')
      .eq('business_id', business.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    business,
    sponsored_bid: activeBid ?? null,
    recent_reviews: reviews ?? [],
  });
}
