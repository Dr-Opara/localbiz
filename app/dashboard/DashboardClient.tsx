'use client';

import { useEffect, useMemo, useState } from 'react';

type Business = { id: string; name: string; category: string; city: string; country: string; currency?: string; verification_status?: string };
type Bid = { id: string; business_id: string; amount_cents: number; currency: string; status: string; placed_at: string };

type DashboardData = {
  account: { email?: string };
  businesses: Business[];
  bids: Bid[];
  summary: { business_count: number; active_bid_count: number; pending_bid_count: number };
};

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch('/api/dashboard', { cache: 'no-store' });
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Could not load dashboard');
    setData(json);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bid = params.get('bid');
    if (bid === 'success') setMessage('Payment confirmed. Your sponsored bid is active.');
    if (bid === 'cancelled') setMessage('Checkout was cancelled. No sponsored placement was activated.');
    if (bid === 'unpaid' || bid === 'invalid' || bid === 'error') setMessage('We could not activate that bid. Please try again.');
    load().catch((error) => setMessage(error.message));
  }, []);

  const businessMap = useMemo(() => new Map((data?.businesses || []).map((b) => [b.id, b.name])), [data]);

  async function createBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Could not create business');
      event.currentTarget.reset();
      setMessage('Business profile created. You can place a sponsored bid now.');
      await load();
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
    try {
      if (!businessId || !Number.isFinite(dollars) || dollars < 1) throw new Error('Choose a business and enter a bid of at least $1.');
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, amount_cents: Math.round(dollars * 100) }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Could not start checkout');
      if (!json.checkout_url) throw new Error('Stripe checkout URL was not returned.');
      window.location.href = json.checkout_url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not place bid');
      setBusy(false);
    }
  }

  return (
    <main className="dashboardPage">
      <header className="topbar">
        <a className="brand" href="/">LOCALBIZ</a>
        <nav><a href="/">Public rankings</a></nav>
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

      <section className="dashboardGrid">
        <article className="panel">
          <span className="eyebrow">STEP 1</span>
          <h2>Create business profile</h2>
          <form className="formStack" onSubmit={createBusiness}>
            <label>Business name<input name="name" required /></label>
            <label>Category<input name="category" placeholder="Plumber" required /></label>
            <div className="formTwo"><label>Country<input name="country" defaultValue="United States" required /></label><label>Country code<input name="country_code" defaultValue="US" maxLength={2} required /></label></div>
            <div className="formTwo"><label>State / region<input name="region" defaultValue="Texas" /></label><label>City<input name="city" defaultValue="Houston" required /></label></div>
            <label>Website<input name="website" type="url" placeholder="https://" /></label>
            <label>Phone<input name="phone" /></label>
            <input name="currency" type="hidden" value="usd" />
            <button className="button" disabled={busy} type="submit">Create business</button>
          </form>
        </article>

        <article className="panel">
          <span className="eyebrow">STEP 2</span>
          <h2>Place sponsored bid</h2>
          {data?.businesses.length ? (
            <form className="formStack" onSubmit={placeBid}>
              <label>Business<select name="business_id" required>{data.businesses.map((business) => <option key={business.id} value={business.id}>{business.name} — {business.city}</option>)}</select></label>
              <label>Bid amount (USD)<input name="amount_dollars" type="number" min="1" step="1" defaultValue="1" required /></label>
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
            <div key={bid.id}><strong>{businessMap.get(bid.business_id) || 'Business'} — ${(bid.amount_cents / 100).toFixed(2)}</strong><span>{bid.status} · {new Date(bid.placed_at).toLocaleString()}</span></div>
          ))}
        </div>
      </section>
    </main>
  );
}
