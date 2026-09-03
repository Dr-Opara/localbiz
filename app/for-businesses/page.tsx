import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Promote Your Local Business',
  description:
    'Compete for transparent sponsored visibility in your city and category on LocalBiz. See the current top bid and choose your placement.',
  alternates: { canonical: '/for-businesses' },
};

export default function ForBusinessesPage() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="/">LOCALBIZ</a>
        <nav>
          <a href="/leaderboard">Live rankings</a>
          <a href="/faq">FAQ</a>
        </nav>
        <a className="button secondary" href="/login">Business login</a>
      </header>

      <section className="hero compactHero">
        <span className="eyebrow">LOCAL BUSINESS VISIBILITY</span>
        <h1 className="claimHeadline">Put your business where local customers can <strong>see it.</strong></h1>
        <p className="claimSub">
          LocalBiz gives businesses a transparent way to compete for sponsored placement in a specific city and category.
          See the current leading bid, choose your amount, and pay only for the placement you select.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
          <a className="button" href="/signup?intent=claim-rank">Create your business profile</a>
          <a className="button secondary" href="/leaderboard">See live rankings</a>
        </div>
      </section>

      <section className="how">
        <div>
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>Simple, visible, transparent.</h2>
          <p className="muted">Sponsored placement is clearly labeled and separate from organic business reputation.</p>
        </div>
        <ol>
          <li><b>01</b><span>Create a profile using your own business information and website.</span></li>
          <li><b>02</b><span>Choose the city and category where your business competes.</span></li>
          <li><b>03</b><span>Place a bid at or above the current market-leading bid.</span></li>
          <li><b>04</b><span>After payment is confirmed, your sponsored placement goes live.</span></li>
        </ol>
      </section>

      <section className="businessSection">
        <span className="eyebrow">BUILT FOR LOCAL BUSINESSES</span>
        <h2>Compete for attention without guessing.</h2>
        <p>
          Instead of buying an opaque advertising package, LocalBiz shows you the current sponsored ranking and bid level for the market you care about.
          Your business keeps its own profile, location, website, and logo identity.
        </p>
        <a className="button" href="/signup?intent=claim-rank">Get started</a>
      </section>

      <footer className="siteFooter">
        <div><strong>LocalBiz</strong><span>Transparent sponsored local rankings.</span></div>
        <div className="footerLinks"><a href="/faq">FAQ</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div>
        <a className="footerCredit" href="https://theboringproduct.com">Built by The Boring Product</a>
      </footer>
    </main>
  );
}
