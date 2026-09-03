import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { syncMarketForBusiness } from '@/lib/markets';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

function normalizeWebsite(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).toString().replace(/\/$/, '');
  } catch {
    throw new Error('Enter a valid website such as expensemargin.com or www.expensemargin.com');
  }
}

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ businesses: data });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const name = String(body.name ?? '').trim();
  const category = String(body.category ?? '').trim();
  const country = String(body.country ?? '').trim();
  const countryCode = String(body.country_code ?? '').trim().toUpperCase();
  const city = String(body.city ?? body.locality ?? '').trim();

  if (!name || !category || !country || !countryCode || !city) {
    return NextResponse.json({ error: 'name, category, country, country_code, and city are required' }, { status: 422 });
  }

  let website: string | null = null;
  try {
    website = normalizeWebsite(body.website);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid website' }, { status: 422 });
  }

  const slugBase = slugify(name) || 'business';
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;

  const payload = {
    owner_id: user.id,
    name,
    slug,
    category,
    description: body.description ?? null,
    website,
    phone: body.phone ?? null,
    email: body.email ?? user.email ?? null,
    country,
    country_code: countryCode,
    region: body.region ?? body.admin_area ?? null,
    admin_area: body.admin_area ?? body.region ?? null,
    city,
    locality: body.locality ?? city,
    postal_code: body.postal_code ?? null,
    address_line1: body.address_line1 ?? null,
    address_line2: body.address_line2 ?? null,
    formatted_address: body.formatted_address ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    place_id: body.place_id ?? null,
    service_area: body.service_area ?? null,
    timezone: body.timezone ?? null,
    locale: body.locale ?? null,
    currency: String(body.currency ?? 'usd').toLowerCase(),
    hours: body.hours ?? {},
    services: Array.isArray(body.services) ? body.services : [],
    verification_status: 'unverified',
    is_active: true,
  };

  const { data, error } = await supabase
    .from('businesses')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not create business' }, { status: 400 });

  await syncMarketForBusiness(data);

  const admin = createSupabaseAdminClient();
  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'business_created',
    entity_type: 'business',
    entity_id: data.id,
    metadata: { country: data.country, city: data.locality || data.city, category: data.category },
  });

  return NextResponse.json({ business: data }, { status: 201 });
}
