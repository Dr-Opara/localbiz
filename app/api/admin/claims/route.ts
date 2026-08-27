import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const { user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('business_claims')
    .select('*,businesses(id,name,slug,country,country_code,region,city,category,verification_status,owner_id),profiles!business_claims_claimant_id_fkey(id,full_name,email)')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ claims: data });
}
