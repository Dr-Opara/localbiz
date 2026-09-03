export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <main className="authPage">
      <section className="authCard">
        <a className="brand" href="/">LOCALBIZ</a>
        <span className="eyebrow">BUSINESS OWNER LOGIN</span>
        <h1>Welcome back.</h1>
        <p>Manage your business profiles, bids, payments, and sponsored placement.</p>
        {params.message ? <div className="notice">{params.message}</div> : null}
        {params.error ? <div className="notice error">{params.error}</div> : null}
        <form action="/api/auth/login" method="post" className="formStack">
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="button" type="submit">Sign in</button>
        </form>
        <p className="authFoot">New to LocalBiz? <a href="/signup">Create an account</a></p>
      </section>
    </main>
  );
}
