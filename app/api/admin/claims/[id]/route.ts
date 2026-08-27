import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json();
  const decision = String(body.status ?? '').toLowerCase();

  if (!['approved', 'rejected'].includes(decision)) {
    return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();
  const { data: claim, error: claimError } = await admin
    .from('business_claims')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .single();

  if (claimError || !claim) {
    return NextResponse.json({ error: 'Pending claim not found' }, { status: 404 });
  }

  if (decision === 'approved') {
    const { error: businessError } = await admin
      .from('businesses')
      .update({
        owner_id: claim.claimant_id,
        verification_status: 'verified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', claim.business_id);

    if (businessError) {
      return NextResponse.json({ error: businessError.message }, { status: 400 });
    }

    await admin
      .from('business_claims')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('business_id', claim.business_id)
      .eq('status', 'pending')
      .neq('id', claim.id);
  }

  const { data: reviewed, error } = await admin
    .from('business_claims')
    .update({ status: decision, reviewed_at: new Date().toISOString() })
    .eq('id', claim.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: `business_claim_${decision}`,
    entity_type: 'business_claim',
    entity_id: claim.id,
    metadata: {
      business_id: claim.business_id,
      claimant_id: claim.claimant_id,
    },
  });

  return NextResponse.json({ claim: reviewed });
}
