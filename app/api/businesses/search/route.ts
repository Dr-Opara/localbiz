import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const country = (url.searchParams.get('country') || '').trim();
  const city = (url.searchParams.get('city') || '').trim();
  const category = (url.searchParams.get('category') || '').trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 20), 1), 50);

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('businesses')
    .select('id,name,slug,category,description,website,phone,country,country_code,region,city,locality,formatted_address,rating,review_count,verification_status,is_active')
    .eq('is_active', true)
    .limit(limit)
    .order('verification_status', { ascending: false })
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .order('name');

  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
  if (country) query = query.ilike('country', country);
  if (city) query = query.or(`city.ilike.${city},locality.ilike.${city}`);
  if (category) query = query.ilike('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ businesses: data ?? [] });
}
