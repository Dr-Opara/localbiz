export const metadata = {
  title: 'Terms of Use | LocalBiz',
  description: 'Terms governing use of LocalBiz and sponsored local business placements.',
};

export default function TermsPage() {
  return (
    <main className="legalPage">
      <header className="topbar">
        <a className="brand" href="/">LOCALBIZ</a>
        <nav><a href="/leaderboard">Public rankings</a><a href="/login">Sign in</a></nav>
      </header>

      <section className="legalHero">
        <span className="eyebrow">LEGAL</span>
        <h1>Terms of Use</h1>
        <p>Effective September 3, 2026</p>
      </section>

      <section className="legalContent">
        <h2>1. Acceptance of these terms</h2>
        <p>By accessing or using LocalBiz, you agree to these Terms of Use. If you do not agree, do not use the service.</p>

        <h2>2. LocalBiz service</h2>
        <p>LocalBiz provides business profiles, market discovery, and clearly labeled sponsored placement opportunities. Sponsored placement is advertising. It does not constitute an endorsement, certification, warranty, or guarantee of any business, product, service, price, availability, or quality.</p>

        <h2>3. Accounts and business profiles</h2>
        <p>You are responsible for the accuracy of information submitted through your account and for maintaining the security of your login credentials. You may only create or manage business profiles that you are authorized to represent.</p>

        <h2>4. Sponsored bids and ranking</h2>
        <p>Sponsored rankings are based primarily on qualifying active paid bids within a defined market, such as location and category. LocalBiz may require a bid to meet or exceed the current highest qualifying bid in that market. Equal bids may be ordered by the time they became eligible or by other neutral tie-breaking logic.</p>

        <h2>5. Payments</h2>
        <p>Payments are processed by third-party payment providers such as Stripe. A sponsored placement is not activated until payment is confirmed. Prices, minimum bid amounts, placement availability, and payment methods may change.</p>

        <h2>6. Refunds and payment disputes</h2>
        <p>Because sponsored placement may begin immediately after payment confirmation, payments are generally non-refundable except where required by law or where LocalBiz determines that a technical or billing error occurred. Chargebacks or payment disputes may result in suspension of the related placement or account while the issue is reviewed.</p>

        <h2>7. Business information and logos</h2>
        <p>LocalBiz may display business information provided by account holders and may retrieve publicly available website branding, such as a favicon, from the business website entered by the account holder. You represent that information you submit is accurate and that you have the right to provide it.</p>

        <h2>8. Prohibited activity</h2>
        <p>You may not use LocalBiz for fraud, impersonation, illegal activity, manipulation of rankings through unauthorized means, infringement of another party's rights, malicious interference with the service, or submission of false or misleading business information.</p>

        <h2>9. Moderation and removal</h2>
        <p>LocalBiz may suspend, restrict, correct, or remove accounts, listings, bids, or content that violate these terms, create security or legal risk, involve suspected fraud, or interfere with the integrity of the marketplace.</p>

        <h2>10. Availability and changes</h2>
        <p>LocalBiz is provided on an as-available basis. Features may be added, changed, limited, or discontinued. LocalBiz does not guarantee uninterrupted availability or any particular ranking, traffic level, lead volume, or business result.</p>

        <h2>11. Third-party services</h2>
        <p>LocalBiz relies on third-party services for functions including hosting, authentication, databases, email delivery, and payments. Your use of those features may also be subject to the applicable third party's terms and privacy practices.</p>

        <h2>12. Disclaimer</h2>
        <p>To the maximum extent permitted by law, LocalBiz is provided without warranties of any kind, whether express or implied. You are responsible for evaluating businesses and deciding whether to transact with them.</p>

        <h2>13. Limitation of liability</h2>
        <p>To the maximum extent permitted by law, LocalBiz and its operators will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising from use of the service, sponsored placement results, third-party services, or transactions between users and businesses.</p>

        <h2>14. Updates to these terms</h2>
        <p>We may update these terms as the service changes. Continued use after an updated version becomes effective constitutes acceptance of the revised terms.</p>
      </section>

      <footer className="legalFooter"><a href="/">Home</a><a href="/faq">FAQ</a><a href="/privacy">Privacy</a></footer>
    </main>
  );
}
