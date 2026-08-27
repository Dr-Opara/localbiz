import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const signature = request.headers.get('stripe-signature');

  if (!secret || !stripeKey || !signature) {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const bidId = session.metadata?.localbiz_bid_id;
  const businessId = session.metadata?.business_id;
  const ownerId = session.metadata?.owner_id || null;

  if (session.payment_status !== 'paid' || !bidId || !businessId) {
    return NextResponse.json({ received: true });
  }

  const admin = createSupabaseAdminClient();

  const { data: existingEvent } = await admin
    .from('payment_events')
    .select('id')
    .eq('provider_event_id', event.id)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const { data: bid } = await admin
    .from('bids')
    .select('id,business_id,amount_cents,currency,status')
    .eq('id', bidId)
    .eq('business_id', businessId)
    .single();

  if (!bid || session.amount_total !== bid.amount_cents || session.currency !== bid.currency) {
    return NextResponse.json({ error: 'Payment does not match bid' }, { status: 409 });
  }

  await admin.from('payment_events').insert({
    provider: 'stripe',
    provider_event_id: event.id,
    event_type: event.type,
    bid_id: bidId,
    payload: {
      checkout_session_id: session.id,
      payment_intent: session.payment_intent,
      amount_total: session.amount_total,
      currency: session.currency,
    },
  });

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
    .in('status', ['pending', 'active']);

  await admin.from('audit_logs').insert({
    actor_id: ownerId,
    action: 'bid_activated',
    entity_type: 'bid',
    entity_id: bidId,
    metadata: {
      source: 'stripe_webhook',
      stripe_event_id: event.id,
      checkout_session_id: session.id,
      business_id: businessId,
      amount_total: session.amount_total,
      currency: session.currency,
    },
  });

  return NextResponse.json({ received: true });
}
