import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('business_claims')
    .select('*,businesses(id,name,slug,country,city,category,verification_status)')
    .eq('claimant_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ claims: data });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const businessId = String(body.business_id ?? '');
  if (!businessId) return NextResponse.json({ error: 'business_id is required' }, { status: 422 });

  const { data: business } = await supabase
    .from('businesses')
    .select('id,owner_id')
    .eq('id', businessId)
    .eq('is_active', true)
    .single();

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  if (business.owner_id === user.id) return NextResponse.json({ error: 'You already own this business' }, { status: 409 });

  const { data: existing } = await supabase
    .from('business_claims')
    .select('id,status')
    .eq('business_id', businessId)
    .eq('claimant_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) return NextResponse.json({ claim: existing, existing: true });

  const { data, error } = await supabase
    .from('business_claims')
    .insert({
      business_id: businessId,
      claimant_id: user.id,
      evidence: body.evidence ?? {},
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ claim: data }, { status: 201 });
}
