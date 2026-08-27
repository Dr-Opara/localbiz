import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ALLOWED_EVENTS = new Set(['impression', 'profile_view', 'website_click', 'phone_click']);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const businessId = String(body.business_id ?? '').trim();
  const eventType = String(body.event_type ?? '').trim();

  if (!businessId || !ALLOWED_EVENTS.has(eventType)) {
    return NextResponse.json({ error: 'Valid business_id and event_type are required' }, { status: 422 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('id,country,city,locality,category,is_active')
    .eq('id', businessId)
    .eq('is_active', true)
    .single();

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const { error } = await supabase.from('business_events').insert({
    business_id: business.id,
    event_type: eventType,
    country: business.country,
    city: business.locality || business.city,
    category: business.category,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tracked: true }, { status: 201 });
}
