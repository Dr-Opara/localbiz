import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const businessId = String(url.searchParams.get('business_id') ?? '').trim();
  if (!businessId) return NextResponse.json({ error: 'business_id is required' }, { status: 422 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('reviews')
    .select('id,business_id,reviewer_id,rating,title,body,status,created_at,updated_at')
    .eq('business_id', businessId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const reviewerIds = Array.from(new Set((data ?? []).map((review) => review.reviewer_id)));
  const names = new Map<string, string | null>();
  if (reviewerIds.length) {
    const { data: profiles } = await admin.from('profiles').select('id,full_name').in('id', reviewerIds);
    for (const profile of profiles ?? []) names.set(profile.id, profile.full_name);
  }

  return NextResponse.json({
    reviews: (data ?? []).map((review) => ({
      ...review,
      reviewer_name: names.get(review.reviewer_id) || 'LocalBiz user',
    })),
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const businessId = String(body.business_id ?? '').trim();
  const rating = Number(body.rating);
  const title = String(body.title ?? '').trim().slice(0, 120) || null;
  const reviewBody = String(body.body ?? '').trim().slice(0, 3000) || null;

  if (!businessId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'business_id and rating from 1 to 5 are required' }, { status: 422 });
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id,owner_id,is_active')
    .eq('id', businessId)
    .eq('is_active', true)
    .single();

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  if (business.owner_id === user.id) return NextResponse.json({ error: 'Business owners cannot review their own business' }, { status: 409 });

  const { data, error } = await supabase
    .from('reviews')
    .insert({ business_id: businessId, reviewer_id: user.id, rating, title, body: reviewBody, status: 'published' })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'You have already reviewed this business' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ review: data }, { status: 201 });
}
