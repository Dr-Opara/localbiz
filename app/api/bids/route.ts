import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireUser } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id);
  const ids = (businesses ?? []).map((b) => b.id);
  if (!ids.length) return NextResponse.json({ bids: [] });

  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .in('business_id', ids)
    .order('placed_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ bids: data });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const businessId = String(body.business_id ?? '');
  const amountCents = Number(body.amount_cents ?? 0);

  if (!businessId || !Number.isInteger(amountCents) || amountCents < 100) {
    return NextResponse.json({ error: 'Choose a business and enter a bid of at least $1.' }, { status: 422 });
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id,name,category,country,country_code,region,admin_area,city,locality,currency')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single();

  if (businessError || !business) {
    return NextResponse.json({ error: 'Business not found or not owned by this account' }, { status: 404 });
  }

  const currency = String(body.currency ?? business.currency ?? 'usd').toLowerCase();
  const city = business.locality || business.city;
  const region = business.admin_area || business.region;
  const admin = createSupabaseAdminClient();

  let marketQuery = admin
    .from('businesses')
    .select('id')
    .eq('is_active', true)
    .ilike('category', business.category)
    .or(`city.ilike.${city},locality.ilike.${city}`);

  marketQuery = business.country_code
    ? marketQuery.eq('country_code', business.country_code)
    : marketQuery.ilike('country', business.country);

  if (region) marketQuery = marketQuery.or(`region.ilike.${region},admin_area.ilike.${region}`);

  const { data: marketBusinesses, error: marketError } = await marketQuery.limit(500);
  if (marketError) return NextResponse.json({ error: marketError.message }, { status: 400 });

  const marketBusinessIds = (marketBusinesses ?? []).map((entry) => entry.id);
  let highestBidCents = 0;

  if (marketBusinessIds.length) {
    const now = new Date().toISOString();
    const { data: highestBid, error: highestBidError } = await admin
      .from('bids')
      .select('amount_cents')
      .in('business_id', marketBusinessIds)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('amount_cents', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (highestBidError) return NextResponse.json({ error: highestBidError.message }, { status: 400 });
    highestBidCents = Number(highestBid?.amount_cents || 0);
  }

  const minimumBidCents = Math.max(100, highestBidCents);
  if (amountCents < minimumBidCents) {
    return NextResponse.json(
      {
        error: `The current highest bid in this market is $${(highestBidCents / 100).toFixed(2)}. Your bid must be at least $${(minimumBidCents / 100).toFixed(2)}.`,
        highest_bid_cents: highestBidCents,
        minimum_bid_cents: minimumBidCents,
      },
      { status: 409 }
    );
  }

  const { data: bid, error: bidError } = await admin
    .from('bids')
    .insert({
      business_id: business.id,
      amount_cents: amountCents,
      currency,
      country: business.country,
      country_code: business.country_code,
      region,
      admin_area: region,
      city,
      locality: city,
      category: business.category,
      status: 'pending',
    })
    .select('*')
    .single();

  if (bidError || !bid) {
    return NextResponse.json({ error: bidError?.message ?? 'Could not create bid' }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ bid, checkoutRequired: true, error: 'Stripe is not configured yet' }, { status: 503 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = process.env.APP_URL || new URL(request.url).origin;

    const sessionParams: Stripe.Checkout.SessionCreateParams & {
      managed_payments?: { enabled: boolean };
    } = {
      mode: 'payment',
      customer_email: user.email ?? undefined,
      managed_payments: { enabled: false },
      line_items: [{
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amountCents,
          product_data: {
            name: `LocalBiz sponsored bid — ${business.name}`,
            description: `${business.category} in ${city}, ${business.country}`,
          },
        },
      }],
      success_url: `${appUrl}/api/bids/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?bid=cancelled`,
      metadata: {
        localbiz_bid_id: bid.id,
        business_id: business.id,
        owner_id: user.id,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      await admin.from('bids').update({ status: 'failed' }).eq('id', bid.id).eq('status', 'pending');
      return NextResponse.json({ error: 'Stripe checkout URL was not returned' }, { status: 502 });
    }

    return NextResponse.json({ bid, checkout_url: session.url }, { status: 201 });
  } catch (error) {
    await admin.from('bids').update({ status: 'failed' }).eq('id', bid.id).eq('status', 'pending');
    const message = error instanceof Error ? error.message : 'Could not create Stripe checkout session';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
