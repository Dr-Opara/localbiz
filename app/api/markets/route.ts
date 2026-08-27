import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = (url.searchParams.get('country') || '').trim();
  const city = (url.searchParams.get('city') || '').trim();
  const category = (url.searchParams.get('category') || '').trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 100);

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('markets')
    .select('*')
    .eq('is_active', true)
    .order('country')
    .order('city')
    .order('category')
    .limit(limit);

  if (country) query = query.ilike('country', country);
  if (city) query = query.ilike('city', city);
  if (category) query = query.ilike('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ markets: data ?? [] });
}
