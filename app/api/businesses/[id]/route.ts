import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';

const editableFields = [
  'name','category','description','website','phone','email','country','country_code',
  'region','admin_area','city','locality','postal_code','address_line1','address_line2',
  'formatted_address','latitude','longitude','place_id','service_area','timezone','locale',
  'currency','hours','services'
] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const field of editableFields) {
    if (field in body) updates[field] = body[field];
  }
  if (typeof updates.country_code === 'string') updates.country_code = updates.country_code.toUpperCase();
  if (typeof updates.currency === 'string') updates.currency = updates.currency.toLowerCase();

  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Business not found or update failed' }, { status: 404 });
  return NextResponse.json({ business: data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const { data, error } = await supabase
    .from('businesses')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('id,is_active')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  return NextResponse.json({ business: data });
}
