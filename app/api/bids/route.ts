import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireUser } from '@/lib/auth';

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id);

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
    return NextResponse.json({ error: 'business_id and a bid of at least 100 minor units are required' }, { status: 422 });
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

  const { data: bid, error: bidError } = await supabase
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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email ?? undefined,
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
    success_url: `${appUrl}/dashboard?bid=success`,
    cancel_url: `${appUrl}/dashboard?bid=cancelled`,
    metadata: {
      localbiz_bid_id: bid.id,
      business_id: business.id,
      owner_id: user.id,
    },
  });

  return NextResponse.json({ bid, checkout_url: session.url }, { status: 201 });
}
