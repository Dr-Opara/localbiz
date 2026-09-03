export const metadata = {
  title: 'FAQ | LocalBiz',
  description: 'Frequently asked questions about LocalBiz sponsored local rankings.',
};

export default function FAQPage() {
  return (
    <main className="legalPage">
      <header className="topbar">
        <a className="brand" href="/">LOCALBIZ</a>
        <nav><a href="/leaderboard">Public rankings</a><a href="/login">Sign in</a></nav>
      </header>

      <section className="legalHero">
        <span className="eyebrow">HELP</span>
        <h1>Frequently asked questions</h1>
        <p>How LocalBiz sponsored rankings, business profiles, payments, and account data work.</p>
      </section>

      <section className="legalContent">
        <h2>What is LocalBiz?</h2>
        <p>LocalBiz is a marketplace where local businesses can create a profile and pay for clearly labeled sponsored placement within a specific market, such as a city and business category.</p>

        <h2>How are sponsored rankings determined?</h2>
        <p>Sponsored positions are ordered primarily by the active paid bid for that market. Higher bids rank above lower bids. If bids are equal, earlier qualifying bids may rank first.</p>

        <h2>What is the minimum bid?</h2>
        <p>The minimum bid is based on the current highest active bid in the same market. If the highest active bid is $4, a new bid must be at least $4. LocalBiz may also enforce a platform minimum where no active bid exists.</p>

        <h2>Does paying for placement mean LocalBiz recommends the business?</h2>
        <p>No. Paid placements are labeled as sponsored. A sponsored position reflects paid placement, not an endorsement, guarantee, certification, or statement about service quality.</p>

        <h2>Are business reviews part of sponsored ranking?</h2>
        <p>No. Sponsored ranking is separate from reputation signals. LocalBiz may display verification or reputation information separately when those features are available.</p>

        <h2>Where does a business logo come from?</h2>
        <p>When a business provides a website, LocalBiz may attempt to display the favicon or other publicly available branding associated with that business domain. If no logo can be found, LocalBiz may show the business initials instead.</p>

        <h2>Can one account manage multiple businesses?</h2>
        <p>Yes, if enabled for that account. Each business profile remains associated with the signed-in owner account and retains its own business information, website, location, category, and bids.</p>

        <h2>How do payments work?</h2>
        <p>Sponsored bids are processed through Stripe. A bid becomes active only after LocalBiz receives confirmation that the payment was completed successfully.</p>

        <h2>Can I cancel a bid after paying?</h2>
        <p>Sponsored placement purchases are generally intended to take effect immediately after payment. Contact LocalBiz if you believe a payment was made in error or there was a technical issue.</p>

        <h2>How do I contact LocalBiz?</h2>
        <p>Use the contact information provided on the LocalBiz website for account, billing, privacy, or business-profile questions.</p>
      </section>

      <footer className="legalFooter"><a href="/">Home</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></footer>
    </main>
  );
}
