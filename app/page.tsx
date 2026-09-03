'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import BusinessLogo from './components/BusinessLogo';

type LiveBid = {
  id: string;
  amount_cents: number;
  currency: string;
  placed_at: string;
  business: {
    id: string;
    name: string;
    slug: string;
    website?: string | null;
    rating?: number | null;
    review_count?: number | null;
    verification_status?: string | null;
  };
  market: {
    country?: string | null;
    country_code?: string | null;
    continent?: string | null;
    region?: string | null;
    city?: string | null;
    category?: string | null;
  };
};

type Viewer = { country_code?: string | null; continent?: string | null };

const continentFilters = ['All', 'North America', 'Africa', 'Asia', 'Europe', 'South America', 'Oceania'];
const continentLabels: Record<string, string> = {
  'North America': 'N. America',
  'South America': 'S. America',
  Africa: 'Africa',
  Asia: 'Asia',
  Europe: 'Europe',
  Oceania: 'Oceania',
  All: 'All',
};

function flagEmoji(countryCode?: string | null) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  return countryCode.toUpperCase().replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export default function Home() {
  const [bids, setBids] = useState<LiveBid[]>([]);
  const [viewer, setViewer] = useState<Viewer>({});
  const [geoFilter, setGeoFilter] = useState('near');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(0);

  async function loadLiveBids() {
    try {
      const response = await fetch('/api/live-bids', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Could not load live bids');
      setBids(json.bids || []);
      setViewer(json.viewer || {});
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load live bids');
    } finally {
      setLoading(false);
    }
  }

  async function heartbeat() {
    try {
      let visitorId = window.localStorage.getItem('localbiz_visitor_id');
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        window.localStorage.setItem('localbiz_visitor_id', visitorId);
      }
      const response = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId }),
      });
      const json = await response.json();
      if (response.ok) setOnline(Number(json.online || 0));
    } catch {}
  }

  useEffect(() => {
    loadLiveBids();
    heartbeat();
    const bidsTimer = window.setInterval(loadLiveBids, 15000);
    const presenceTimer = window.setInterval(heartbeat, 60000);
    return () => {
      window.clearInterval(bidsTimer);
      window.clearInterval(presenceTimer);
    };
  }, []);

  const visibleBids = useMemo(() => {
    if (geoFilter === 'All') return bids;
    if (geoFilter === 'near') {
      if (!viewer.country_code) return bids;
      return bids.filter((bid) => bid.market.country_code === viewer.country_code);
    }
    return bids.filter((bid) => bid.market.continent === geoFilter);
  }, [bids, geoFilter, viewer.country_code]);

  const topBid = bids[0]?.amount_cents ?? 0;
  const currency = (bids[0]?.currency || 'usd').toUpperCase();
  const money = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }), [currency]);

  function openLeaderboard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const country = String(form.get('country') || '').trim();
    const city = String(form.get('city') || '').trim();
    const category = String(form.get('category') || '').trim();
    if (!country || !city || !category) return;
    window.location.href = `/leaderboard?${new URLSearchParams({ country, city, category }).toString()}`;
  }

  function claimRank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const website = String(form.get('website') || '').trim();
    const category = String(form.get('claim_category') || '').trim();
    if (!website || !category) return;
    window.location.href = `/signup?${new URLSearchParams({ website, category, intent: 'claim-rank' }).toString()}`;
  }

  const claimAmount = topBid ? money.format(topBid / 100 + 1) : money.format(1);
  const nearLabel = viewer.country_code ? `Near you ${flagEmoji(viewer.country_code)}` : 'Near you';
  const activeGeoLabel = geoFilter === 'near' ? nearLabel : continentLabels[geoFilter] || geoFilter;

  return (
    <main>
      <header className="topbar">
        <div className="brandCluster"><a className="brand" href="/">LOCALBIZ</a><div className="livePill"><span className="liveDot" />{online || 1} online</div></div>
        <nav><a href="#rankings">Live bids</a><a href="#how">How it works</a><a href="#business">For businesses</a><a href="/login">Sign in</a></nav>
        <a className="button secondary" href="/signup">List your business</a>
      </header>

      <section className="hero compactHero">
        <div className="eyebrow">LIVE LOCAL MARKETPLACE</div>
        <div className="claimHeadline">Claim #1 for <strong>{claimAmount}</strong></div>
        <form className="claimBar" onSubmit={claimRank}>
          <label className="claimUrl"><span>↗</span><input name="website" placeholder="Your business URL" required /></label>
          <label className="claimCategory"><input name="claim_category" list="localbiz-categories" placeholder="Choose a category" required /><datalist id="localbiz-categories"><option value="Business Software / Financial Technology" /><option value="Plumber" /><option value="Restaurant" /><option value="Urgent Care" /><option value="Grocery Market" /><option value="HVAC" /><option value="Dental" /><option value="Auto Repair" /><option value="Cleaning Service" /><option value="Real Estate" /></datalist></label>
          <button className="button claimButton" type="submit">Claim LocalBiz rank</button>
        </form>
        <p className="claimSub">Browse live bids without an account. Sign in only when you are ready to compete.</p>
      </section>

      <section className="leaderboard" id="rankings">
        <div className="sectionHead"><div><span className="eyebrow">LIVE NOW</span><h2>{visibleBids.length ? `${visibleBids.length} active bid${visibleBids.length === 1 ? '' : 's'}` : 'Live bids'}</h2></div><p>{topBid ? `Highest active bid: ${money.format(topBid / 100)}.` : 'Active sponsored bids appear here as soon as payment is confirmed.'} Rankings refresh automatically.</p></div>

        <div className="geoFilterWrap">
          <div className="geoFilterIntro"><strong>Browse by region</strong><span>Showing {activeGeoLabel}</span></div>
          <div className="geoFilters" role="tablist" aria-label="Filter live bids by geography">
            <button className={geoFilter === 'near' ? 'geoChip active' : 'geoChip'} onClick={() => setGeoFilter('near')} type="button">{nearLabel}</button>
            {continentFilters.map((continent) => (
              <button key={continent} className={geoFilter === continent ? 'geoChip active' : 'geoChip'} onClick={() => setGeoFilter(continent)} type="button">{continentLabels[continent] || continent}</button>
            ))}
          </div>
        </div>

        <form className="searchBar" onSubmit={openLeaderboard}><label>Country<input name="country" defaultValue="United States" /></label><label>City<input name="city" defaultValue="Austin" /></label><label>Category<input name="category" defaultValue="Business Software / Financial Technology" /></label><button className="button" type="submit">View market</button></form>
        {loading ? <p className="muted">Loading live bids…</p> : null}
        {error ? <div className="notice">{error}</div> : null}
        <div className="rows">
          {visibleBids.map((bid, index) => {
            const bidMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: (bid.currency || 'usd').toUpperCase(), maximumFractionDigits: 2 }).format(bid.amount_cents / 100);
            const query = new URLSearchParams({ country: bid.market.country || '', city: bid.market.city || '', category: bid.market.category || '' });
            return (
              <article className="row" key={bid.id}>
                <div className="rank">#{index + 1}</div>
                <BusinessLogo name={bid.business.name} website={bid.business.website} />
                <div className="business"><span className="sponsored">SPONSORED</span><h3>{bid.business.name}</h3><p>{bid.market.city}{bid.market.region ? `, ${bid.market.region}` : ''} · <span className="countryFlag" title={bid.market.country || bid.market.country_code || 'Country'}>{flagEmoji(bid.market.country_code)}</span> · {bid.market.category}</p></div>
                <div className="rating"><strong>{bid.business.verification_status === 'verified' ? 'Verified' : 'New listing'}</strong><span>{bid.business.review_count || 0} reviews</span></div>
                <div className="bid"><span>Current bid</span><strong>{bidMoney}</strong></div>
                <a className="button small" href={`/leaderboard?${query.toString()}`}>View market</a>
              </article>
            );
          })}
          {!loading && !visibleBids.length ? <div className="emptyRegion"><strong>No active bids in {activeGeoLabel} yet.</strong><span>Switch regions or be the first business to claim a sponsored position here.</span></div> : null}
        </div>
      </section>

      <section className="how" id="how"><div><span className="eyebrow">HOW LOCALBIZ WORKS</span><h2>Public rankings. Paid placement. Clear rules.</h2></div><ol><li><b>01</b><span>Anyone can browse live bids and market rankings.</span></li><li><b>02</b><span>Business owners create or claim a profile.</span></li><li><b>03</b><span>Owners place a sponsored placement bid.</span></li><li><b>04</b><span>The highest active bid takes the top sponsored position.</span></li></ol></section>
      <section className="businessSection" id="business"><span className="eyebrow">FOR LOCAL BUSINESSES</span><h2>Want the top spot?</h2><p>Your market is public, your bid is transparent, and visitors can discover businesses by their own country or browse across continents.</p><a className="button" href="/signup">Create business profile</a></section>
      <footer className="siteFooter"><div><strong>LOCALBIZ</strong><span>Transparent sponsored local rankings.</span></div><div className="footerLinks"><a href="#how">Rules</a><a href="#business">FAQ</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div><div>Built by <a className="footerCredit" href="https://theboringproduct.com" target="_blank" rel="noreferrer">The Boring Product</a></div></footer>
    </main>
  );
}
