'use client';

import { useEffect, useMemo, useState } from 'react';

type Entry = {
  id: string;
  name: string;
  category: string;
  city?: string;
  locality?: string;
  region?: string;
  country?: string;
  website?: string | null;
  rating?: number | null;
  review_count?: number | null;
  verification_status?: string | null;
  position: number;
  placement_type: 'sponsored' | 'organic';
  bid?: { amount_cents: number; currency: string } | null;
};

type LeaderboardResponse = {
  market: { country_code?: string | null; country?: string | null; city: string; region?: string | null; category: string };
  disclosure?: string;
  leaderboard: Entry[];
  error?: string;
};

export default function LeaderboardClient() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const countryCode = params.get('country_code') || 'US';
  const country = params.get('country') || 'United States';
  const city = params.get('city') || 'Austin';
  const region = params.get('region') || 'Texas';
  const category = params.get('category') || 'Business Software / Financial Technology';
  const highlight = params.get('business_id') || '';
  const bidSuccess = params.get('bid') === 'success';

  useEffect(() => {
    const query = new URLSearchParams({ country_code: countryCode, city, category });
    if (region) query.set('region', region);
    fetch(`/api/leaderboard?${query.toString()}`, { cache: 'no-store' })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Could not load leaderboard');
        return json;
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load leaderboard'))
      .finally(() => setLoading(false));
  }, [countryCode, city, region, category]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/">LOCALBIZ</a>
        <nav><a href="/dashboard">Owner dashboard</a></nav>
        <a className="button secondary" href="/signup">List your business</a>
      </header>

      <section className="dashboardHero">
        <span className="eyebrow">LIVE MARKET LEADERBOARD</span>
        <h1>{category}<br />in {city}.</h1>
        <p>{region ? `${city}, ${region}` : city} · {country}</p>
        {bidSuccess ? <div className="notice">Payment confirmed. Your sponsored bid is active on this leaderboard.</div> : null}
      </section>

      <section className="leaderboard">
        <div className="sectionHead">
          <div><span className="eyebrow">ACTIVE RANKINGS</span><h2>Sponsored first. Organic after.</h2></div>
          <p>{data?.disclosure || 'Sponsored positions are ordered by paid bid.'}</p>
        </div>

        {loading ? <p className="muted">Loading live leaderboard…</p> : null}
        {error ? <div className="notice">{error}</div> : null}
        {!loading && !error && !data?.leaderboard.length ? <p className="muted">No businesses are ranked in this market yet.</p> : null}

        <div className="rows">
          {(data?.leaderboard || []).map((entry) => {
            const isHighlighted = highlight && entry.id === highlight;
            return (
              <article className={`row ${isHighlighted ? 'highlightRow' : ''}`} key={entry.id}>
                <div className="rank">#{entry.position}</div>
                <div className="business">
                  <span className={entry.placement_type === 'sponsored' ? 'sponsored' : 'organicLabel'}>
                    {entry.placement_type === 'sponsored' ? 'SPONSORED' : 'ORGANIC'}
                  </span>
                  <h3>{entry.name}</h3>
                  <p>{entry.category} · {entry.locality || entry.city}, {entry.region || entry.country}</p>
                </div>
                <div className="rating"><strong>{entry.rating ? `★ ${entry.rating}` : 'New'}</strong><span>{entry.review_count || 0} reviews</span></div>
                <div className="bid">
                  <span>{entry.placement_type === 'sponsored' ? 'Current bid' : 'Placement'}</span>
                  <strong>{entry.bid ? `$${(entry.bid.amount_cents / 100).toFixed(2)}` : 'Organic'}</strong>
                </div>
                {entry.website ? <a className="button small" href={entry.website} target="_blank" rel="noreferrer">Visit business</a> : <span />}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
