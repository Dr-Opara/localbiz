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

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const bidId = session.metadata?.localbiz_bid_id;
    const businessId = session.metadata?.business_id;

    if (session.payment_status !== 'paid' || !bidId || !businessId) {
      return NextResponse.redirect(`${appUrl}/dashboard?bid=unpaid`);
    }

    const admin = createSupabaseAdminClient();
    const { data: bid, error: bidError } = await admin
      .from('bids')
      .select('id,business_id,amount_cents,currency,status')
      .eq('id', bidId)
      .eq('business_id', businessId)
      .single();

    if (bidError || !bid || session.amount_total !== bid.amount_cents || session.currency !== bid.currency) {
      return NextResponse.redirect(`${appUrl}/dashboard?bid=invalid`);
    }

    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;

    const { data: activationResult, error: activationError } = await admin.rpc('activate_paid_bid', {
      p_bid_id: bidId,
      p_business_id: businessId,
      p_payment_intent_id: paymentIntentId,
    });

    if (activationError || activationResult === 'not_found') {
      return NextResponse.redirect(`${appUrl}/dashboard?bid=error`);
    }

    if (activationResult === 'activated') {
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
    }

    if (activationResult === 'activated' || activationResult === 'already_active') {
      const { data: business } = await admin
        .from('businesses')
        .select('id,country,country_code,region,admin_area,city,locality,category')
        .eq('id', businessId)
        .single();

      if (business) {
        const params = new URLSearchParams({
          country_code: business.country_code || '',
          country: business.country || '',
          city: business.locality || business.city || '',
          region: business.admin_area || business.region || '',
          category: business.category || '',
          business_id: business.id,
          bid: 'success',
        });
        return NextResponse.redirect(`${appUrl}/leaderboard?${params.toString()}`);
      }

      return NextResponse.redirect(`${appUrl}/dashboard?bid=success`);
    }

    return NextResponse.redirect(`${appUrl}/dashboard?bid=processed`);
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard?bid=error`);
  }
}
