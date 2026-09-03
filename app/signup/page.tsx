export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="authPage">
      <section className="authCard">
        <a className="brand" href="/">LOCALBIZ</a>
        <span className="eyebrow">BUSINESS OWNER ACCOUNT</span>
        <h1>Create your account.</h1>
        <p>List your business, choose a market, and compete for sponsored placement.</p>
        {params.error ? <div className="notice error">{params.error}</div> : null}
        <form action="/api/auth/signup" method="post" className="formStack">
          <label>Full name<input name="full_name" autoComplete="name" /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <button className="button" type="submit">Create account</button>
        </form>
        <p className="authFoot">Already have an account? <a href="/login">Sign in</a></p>
      </section>
    </main>
  );
}
