import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  const appUrl = process.env.APP_URL || url.origin;

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(`${appUrl}/dashboard?bid=error`);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const bidId = session.metadata?.localbiz_bid_id;
  const businessId = session.metadata?.business_id;

  if (session.payment_status !== 'paid' || !bidId || !businessId) {
    return NextResponse.redirect(`${appUrl}/dashboard?bid=unpaid`);
  }

  const admin = createSupabaseAdminClient();
  const { data: bid } = await admin
    .from('bids')
    .select('id,business_id,amount_cents,currency,status')
    .eq('id', bidId)
    .eq('business_id', businessId)
    .single();

  if (!bid || session.amount_total !== bid.amount_cents || session.currency !== bid.currency) {
    return NextResponse.redirect(`${appUrl}/dashboard?bid=invalid`);
  }

  await admin
    .from('bids')
    .update({ status: 'outbid' })
    .eq('business_id', businessId)
    .eq('status', 'active')
    .neq('id', bidId);

  await admin
    .from('bids')
    .update({
      status: 'active',
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string' ? session.payment_intent : null,
    })
    .eq('id', bidId)
    .eq('status', 'pending');

  await admin.from('audit_logs').insert({
    actor_id: session.metadata?.owner_id || null,
    action: 'bid_activated',
    entity_type: 'bid',
    entity_id: bidId,
    metadata: {
      source: 'checkout_return',
      checkout_session_id: session.id,
      business_id: businessId,
      amount_total: session.amount_total,
      currency: session.currency,
    },
  });

  return NextResponse.redirect(`${appUrl}/dashboard?bid=success`);
}
