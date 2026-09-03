import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
]);

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

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const bidId = session.metadata?.localbiz_bid_id;
  const businessId = session.metadata?.business_id;
  const ownerId = session.metadata?.owner_id || null;

  if (!bidId || !businessId) {
    return NextResponse.json({ received: true, ignored: 'missing_metadata' });
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

  const { data: bid, error: bidError } = await admin
    .from('bids')
    .select('id,business_id,amount_cents,currency,status')
    .eq('id', bidId)
    .eq('business_id', businessId)
    .single();

  if (bidError || !bid) {
    return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : null;

  let stateResult: string = bid.status;

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    if (session.payment_status !== 'paid') {
      if (event.type === 'checkout.session.completed') {
        stateResult = 'awaiting_payment';
      } else {
        return NextResponse.json({ error: 'Successful payment event is not paid' }, { status: 409 });
      }
    } else {
      if (session.amount_total !== bid.amount_cents || session.currency !== bid.currency) {
        return NextResponse.json({ error: 'Payment does not match bid' }, { status: 409 });
      }

      const { data, error } = await admin.rpc('activate_paid_bid', {
        p_bid_id: bidId,
        p_business_id: businessId,
        p_payment_intent_id: paymentIntentId,
      });

      if (error || data === 'not_found') {
        return NextResponse.json({ error: 'Could not activate paid bid' }, { status: 500 });
      }

      stateResult = data;
    }
  } else if (event.type === 'checkout.session.async_payment_failed') {
    const { error } = await admin
      .from('bids')
      .update({ status: 'failed' })
      .eq('id', bidId)
      .eq('business_id', businessId)
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json({ error: 'Could not mark bid payment failed' }, { status: 500 });
    }
    stateResult = 'failed';
  } else if (event.type === 'checkout.session.expired') {
    const { error } = await admin
      .from('bids')
      .update({ status: 'cancelled' })
      .eq('id', bidId)
      .eq('business_id', businessId)
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json({ error: 'Could not cancel expired bid' }, { status: 500 });
    }
    stateResult = 'cancelled';
  }

  const { error: paymentEventError } = await admin.from('payment_events').insert({
    provider: 'stripe',
    provider_event_id: event.id,
    event_type: event.type,
    bid_id: bidId,
    payload: {
      checkout_session_id: session.id,
      payment_intent: session.payment_intent,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      state_result: stateResult,
    },
  });

  if (paymentEventError && paymentEventError.code !== '23505') {
    return NextResponse.json({ error: 'Could not record payment event' }, { status: 500 });
  }

  if (stateResult === 'activated' || stateResult === 'failed' || stateResult === 'cancelled') {
    await admin.from('audit_logs').insert({
      actor_id: ownerId,
      action:
        stateResult === 'activated'
          ? 'bid_activated'
          : stateResult === 'failed'
            ? 'bid_payment_failed'
            : 'bid_checkout_expired',
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
  }

  return NextResponse.json({ received: true, state: stateResult });
}
