const businesses = [
  { rank: 1, name: "Austin Prime Plumbing", location: "Austin, Texas, United States", category: "Plumber", bid: "$425", rating: "4.9", reviews: 318 },
  { rank: 2, name: "Lone Star Flow", location: "Austin, Texas, United States", category: "Plumber", bid: "$310", rating: "4.8", reviews: 204 },
  { rank: 3, name: "Bluebonnet Plumbing Co.", location: "Austin, Texas, United States", category: "Plumber", bid: "$240", rating: "4.7", reviews: 176 },
];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#">BIDSPOT</a>
        <nav><a href="#rankings">Rankings</a><a href="#how">How it works</a><a href="#business">For businesses</a></nav>
        <a className="button secondary" href="#business">List your business</a>
      </header>

      <section className="hero">
        <div className="eyebrow">LOCAL VISIBILITY, PRICED IN PUBLIC</div>
        <h1>Own the spot<br />people see first.</h1>
        <p>BidSpot is a transparent sponsored leaderboard for local businesses anywhere in the world. Choose your market, place a bid, and compete for visible placement.</p>
        <div className="heroActions"><a className="button" href="#rankings">Explore rankings</a><a className="textLink" href="#business">Start bidding →</a></div>
      </section>

      <section className="searchBar" id="rankings">
        <label>Country<input defaultValue="United States" /></label>
        <label>City<input defaultValue="Austin" /></label>
        <label>Category<input defaultValue="Plumber" /></label>
        <button className="button">View leaderboard</button>
      </section>

      <section className="leaderboard">
        <div className="sectionHead"><div><span className="eyebrow">SPONSORED RANK</span><h2>Plumbers in Austin</h2></div><p>Ranking is determined by the highest current placement bid. Sponsored placement does not mean objectively “best.”</p></div>
        <div className="rows">
          {businesses.map((business) => (
            <article className="row" key={business.rank}>
              <div className="rank">#{business.rank}</div>
              <div className="business"><span className="sponsored">SPONSORED</span><h3>{business.name}</h3><p>{business.location} · {business.category}</p></div>
              <div className="rating"><strong>★ {business.rating}</strong><span>{business.reviews} reviews</span></div>
              <div className="bid"><span>Current bid</span><strong>{business.bid}</strong></div>
              <button className="button small">View business</button>
            </article>
          ))}
        </div>
      </section>

      <section className="how" id="how">
        <div><span className="eyebrow">HOW BIDSPOT WORKS</span><h2>One market. One ranking. Public bids.</h2></div>
        <ol><li><b>01</b><span>Choose a location and category.</span></li><li><b>02</b><span>Claim or create your business profile.</span></li><li><b>03</b><span>Place a sponsored placement bid.</span></li><li><b>04</b><span>The highest active bid owns the top sponsored spot.</span></li></ol>
      </section>

      <section className="businessSection" id="business">
        <span className="eyebrow">FOR LOCAL BUSINESSES</span><h2>Put your business on the map.</h2><p>Add your business name, country, region or state, city, postal code, full street address, service area, website, phone, hours, services, and verification details. Visitors can see where you are and what you offer before they contact you.</p><a className="button" href="#">Create business profile</a>
      </section>

      <footer><strong>BIDSPOT</strong><span>Transparent sponsored local rankings.</span><span>© 2026 BidSpot</span></footer>
    </main>
  );
}
