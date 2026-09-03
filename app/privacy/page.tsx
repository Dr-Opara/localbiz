export const metadata = {
  title: 'Privacy Policy | LocalBiz',
  description: 'Privacy practices for LocalBiz accounts, business profiles, payments, and site usage.',
};

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <header className="topbar">
        <a className="brand" href="/">LOCALBIZ</a>
        <nav><a href="/leaderboard">Public rankings</a><a href="/login">Sign in</a></nav>
      </header>

      <section className="legalHero">
        <span className="eyebrow">PRIVACY</span>
        <h1>Privacy Policy</h1>
        <p>Effective September 3, 2026</p>
      </section>

      <section className="legalContent">
        <h2>1. Information we collect</h2>
        <p>LocalBiz may collect account information such as email address, authentication data, business profile information you submit, business website and contact details, location and category information, bid and placement information, payment-related transaction references, and basic technical information needed to operate and secure the service.</p>

        <h2>2. Business profile information</h2>
        <p>Information entered into a public business profile may be displayed publicly, including the business name, website, category, market, and other business details. Do not submit personal information that you do not want associated with a public business listing.</p>

        <h2>3. How we use information</h2>
        <p>We use information to create and manage accounts, associate each account with its own business profiles, operate sponsored rankings, process and confirm payments, provide public market listings, send authentication and service emails, prevent fraud and abuse, troubleshoot issues, and improve the service.</p>

        <h2>4. Payments</h2>
        <p>Payments are processed by Stripe or another payment processor. LocalBiz does not need to store complete payment-card numbers. Payment providers process payment information under their own privacy policies and provide LocalBiz with transaction status and related identifiers needed to activate or manage sponsored placements.</p>

        <h2>5. Authentication and email</h2>
        <p>LocalBiz uses third-party infrastructure for account authentication and transactional email delivery. Authentication emails may include signup confirmation, password reset, and other account-related messages.</p>

        <h2>6. Business logos and website data</h2>
        <p>If a business provides a website, LocalBiz may use that business's domain to retrieve publicly available branding such as a favicon. LocalBiz does not intentionally substitute one business's branding for another business.</p>

        <h2>7. Location and technical data</h2>
        <p>LocalBiz may use coarse location signals, such as country information provided by hosting or network infrastructure, to improve nearby market discovery. We may also process IP-derived or device-related technical data for security, abuse prevention, diagnostics, and basic service analytics.</p>

        <h2>8. Cookies and session data</h2>
        <p>LocalBiz may use cookies or similar browser storage to maintain authenticated sessions, remember limited interface state, support visitor presence features, and protect the service. Disabling necessary session storage may prevent some features from working.</p>

        <h2>9. Service providers</h2>
        <p>We may share information with service providers only as needed to operate LocalBiz, including providers for hosting, databases, authentication, email, and payment processing. These providers process information under their own contractual and privacy obligations.</p>

        <h2>10. We do not sell personal information</h2>
        <p>LocalBiz does not sell users' personal information to advertisers. Sponsored ranking is a service purchased by businesses and is not based on selling customer conversation or account data.</p>

        <h2>11. Data retention</h2>
        <p>We retain information for as long as reasonably necessary to operate the service, maintain transaction and audit records, resolve disputes, prevent fraud, and comply with legal obligations. Information may be deleted or anonymized when it is no longer needed.</p>

        <h2>12. Your choices</h2>
        <p>You may contact LocalBiz to request help with account information, correction of business profile information, or privacy-related questions. Some records may need to be retained for legal, payment, security, or fraud-prevention purposes.</p>

        <h2>13. Security</h2>
        <p>We use reasonable technical and organizational measures intended to protect LocalBiz data. No internet service can guarantee absolute security.</p>

        <h2>14. Changes to this policy</h2>
        <p>We may update this Privacy Policy as LocalBiz changes. The effective date above will be revised when material updates are made.</p>
      </section>

      <footer className="legalFooter"><a href="/">Home</a><a href="/faq">FAQ</a><a href="/terms">Terms</a></footer>
    </main>
  );
}
