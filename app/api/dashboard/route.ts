import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: businesses, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 400 });
  const ids = (businesses ?? []).map((business) => business.id);

  let bids: any[] = [];
  if (ids.length) {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .in('business_id', ids)
      .order('placed_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    bids = data ?? [];
  }

  const { data: claims } = await supabase
    .from('business_claims')
    .select('*')
    .eq('claimant_id', user.id)
    .order('created_at', { ascending: false });

  const activeBids = bids.filter((bid) => bid.status === 'active');
  const pendingBids = bids.filter((bid) => bid.status === 'pending');

  return NextResponse.json({
    account: { id: user.id, email: user.email },
    businesses: businesses ?? [],
    bids,
    claims: claims ?? [],
    summary: {
      business_count: businesses?.length ?? 0,
      verified_business_count: (businesses ?? []).filter((b) => b.verification_status === 'verified').length,
      active_bid_count: activeBids.length,
      pending_bid_count: pendingBids.length,
      pending_claim_count: (claims ?? []).filter((claim) => claim.status === 'pending').length,
    },
  });
}
