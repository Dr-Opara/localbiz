'use client';

import { useEffect, useMemo, useState } from 'react';

type Business = {
  id: string;
  name: string;
  category: string;
  city: string;
  locality?: string;
  region?: string;
  admin_area?: string;
  country: string;
  country_code?: string;
  currency?: string;
  website?: string | null;
  verification_status?: string;
};
type Bid = { id: string; business_id: string; amount_cents: number; currency: string; status: string; placed_at: string };

type DashboardData = {
  account: { email?: string };
  businesses: Business[];
  bids: Bid[];
  summary: { business_count: number; active_bid_count: number; pending_bid_count: number };
};

type MinimumBid = { highest_bid_cents: number; minimum_bid_cents: number; currency: string };

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [minimumBid, setMinimumBid] = useState<MinimumBid | null>(null);

  async function load() {
    const response = await fetch('/api/dashboard', { cache: 'no-store' });
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Could not load dashboard');
    setData(json);
    setSelectedBusinessId((current) => current || json.businesses?.[0]?.id || '');
  }

  async function loadMinimumBid(businessId: string) {
    if (!businessId) {
      setMinimumBid(null);
      return;
    }
    const response = await fetch(`/api/bids/minimum?business_id=${encodeURIComponent(businessId)}`, { cache: 'no-store' });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Could not load current market bid');
    setMinimumBid(json);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bid = params.get('bid');
    if (bid === 'success') setMessage('Payment confirmed. Your sponsored bid is active.');
    if (bid === 'cancelled') setMessage('Checkout was cancelled. No sponsored placement was activated.');
    if (bid === 'unpaid' || bid === 'invalid' || bid === 'error') setMessage('We could not activate that bid. Please try again.');
    load().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) return;
    loadMinimumBid(selectedBusinessId).catch((error) => setMessage(error.message));
  }, [selectedBusinessId]);

  const businessMap = useMemo(() => new Map((data?.businesses || []).map((b) => [b.id, b])), [data]);
  const activeBids = useMemo(() => (data?.bids || []).filter((bid) => bid.status === 'active'), [data]);

  function leaderboardHref(bid: Bid) {
    const business = businessMap.get(bid.business_id);
    if (!business) return '/leaderboard';
    const params = new URLSearchParams({
      country_code: business.country_code || '',
      city: business.locality || business.city,
      category: business.category,
    });
    const region = business.admin_area || business.region;
    if (region) params.set('region', region);
    params.set('highlight', business.id);
    return `/leaderboard?${params.toString()}`;
  }

  async function createBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage('');
    const form = new FormData(formElement);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Could not create business');
      formElement.reset();
      await load();
      setSelectedBusinessId(json.business?.id || '');
      setMessage('Business profile created. Step 2 is ready — place your sponsored bid.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create business');
    } finally {
      setBusy(false);
    }
  }

  async function placeBid(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const dollars = Number(form.get('amount_dollars'));
    const businessId = String(form.get('business_id') || '');
    const minimumDollars = (minimumBid?.minimum_bid_cents ?? 100) / 100;
    try {
      if (!businessId || !Number.isFinite(dollars) || dollars < minimumDollars) {
        throw new Error(`Choose a business and enter a bid of at least $${minimumDollars.toFixed(2)}.`);
      }
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, amount_cents: Math.round(dollars * 100) }),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json.minimum_bid_cents) setMinimumBid((current) => ({
          highest_bid_cents: json.highest_bid_cents ?? json.minimum_bid_cents,
          minimum_bid_cents: json.minimum_bid_cents,
          currency: current?.currency || 'usd',
        }));
        throw new Error(json.error || 'Could not start checkout');
      }
      if (!json.checkout_url) throw new Error('Stripe checkout URL was not returned.');
      window.location.href = json.checkout_url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not place bid');
      setBusy(false);
    }
  }

  const minimumDollars = (minimumBid?.minimum_bid_cents ?? 100) / 100;
  const highestDollars = (minimumBid?.highest_bid_cents ?? 0) / 100;

  return (
    <main className="dashboardPage">
      <header className="topbar">
        <a className="brand" href="/">LOCALBIZ</a>
        <nav><a href="/leaderboard">Public rankings</a></nav>
        <form action="/api/auth/signout" method="post"><button className="button secondary" type="submit">Sign out</button></form>
      </header>

      <section className="dashboardHero">
        <span className="eyebrow">OWNER DASHBOARD</span>
        <h1>Manage your LocalBiz placement.</h1>
        <p>{data?.account?.email || 'Loading account…'}</p>
        {message ? <div className="notice">{message}</div> : null}
      </section>

      <section className="statsGrid">
        <div><span>Businesses</span><strong>{data?.summary.business_count ?? 0}</strong></div>
        <div><span>Active bids</span><strong>{data?.summary.active_bid_count ?? 0}</strong></div>
        <div><span>Pending bids</span><strong>{data?.summary.pending_bid_count ?? 0}</strong></div>
      </section>

      {activeBids.length ? (
        <section className="panel widePanel">
          <span className="eyebrow">ACTIVE SPONSORED PLACEMENT</span>
          <div className="simpleList">
            {activeBids.map((bid) => {
              const business = businessMap.get(bid.business_id);
              return (
                <div key={bid.id}>
                  <strong>{business?.name || 'Business'} — ${(bid.amount_cents / 100).toFixed(2)} active bid</strong>
                  <span>{business ? `${business.category} · ${business.locality || business.city}, ${business.admin_area || business.region || ''} ${business.country}` : 'Active sponsored placement'}</span>
                  <a className="button small" href={leaderboardHref(bid)}>View active leaderboard</a>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="dashboardGrid">
        <article className="panel">
          <span className="eyebrow">STEP 1</span>
          <h2>Create business profile</h2>
          <form className="formStack" onSubmit={createBusiness}>
            <label>Business name<input name="name" required /></label>
            <label>Category<input name="category" placeholder="Enter business category" required /></label>
            <div className="formTwo"><label>Country<input name="country" placeholder="Enter country" required /></label><label>Country code<input name="country_code" placeholder="US" maxLength={2} required /></label></div>
            <div className="formTwo"><label>State / region<input name="region" placeholder="Enter state or region" /></label><label>City<input name="city" placeholder="Enter city" required /></label></div>
            <label>Website<input name="website" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="Enter your business website" /></label>
            <label>Phone<input name="phone" placeholder="Enter business phone" /></label>
            <input name="currency" type="hidden" value="usd" />
            <button className="button" disabled={busy} type="submit">{busy ? 'Creating…' : 'Create business'}</button>
          </form>
        </article>

        <article className="panel">
          <span className="eyebrow">STEP 2</span>
          <h2>Place sponsored bid</h2>
          {data?.businesses.length ? (
            <form className="formStack" onSubmit={placeBid}>
              <label>Business<select name="business_id" required value={selectedBusinessId} onChange={(event) => setSelectedBusinessId(event.target.value)}>{data.businesses.map((business) => <option key={business.id} value={business.id}>{business.name} — {business.city}</option>)}</select></label>
              <label>Bid amount (USD)<input name="amount_dollars" type="number" min={minimumDollars} step="1" defaultValue={minimumDollars} key={`${selectedBusinessId}-${minimumDollars}`} required /></label>
              <p className="muted">{highestDollars > 0 ? `Current highest bid: $${highestDollars.toFixed(2)}. Your bid must be $${minimumDollars.toFixed(2)} or higher.` : `Minimum bid: $${minimumDollars.toFixed(2)}.`}</p>
              <p className="muted">You will be redirected to Stripe Checkout. Your bid becomes active only after Stripe confirms payment.</p>
              <button className="button" disabled={busy} type="submit">Continue to Stripe</button>
            </form>
          ) : <p className="muted">Create a business first to unlock sponsored bidding.</p>}
        </article>
      </section>

      <section className="panel widePanel">
        <span className="eyebrow">YOUR BUSINESSES & BIDS</span>
        <div className="simpleList">
          {(data?.businesses || []).map((business) => (
            <div key={business.id}><strong>{business.name}</strong><span>{business.category} · {business.city}, {business.country} · {business.verification_status || 'unverified'}</span></div>
          ))}
          {!data?.businesses.length ? <p className="muted">No business profiles yet.</p> : null}
        </div>
        <div className="simpleList">
          {(data?.bids || []).map((bid) => (
            <div key={bid.id}><strong>{businessMap.get(bid.business_id)?.name || 'Business'} — ${(bid.amount_cents / 100).toFixed(2)}</strong><span>{bid.status} · {new Date(bid.placed_at).toLocaleString()}</span></div>
          ))}
        </div>
      </section>
    </main>
  );
}
