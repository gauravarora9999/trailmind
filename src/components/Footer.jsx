export default function Footer({ showExplore, showPlanner, showAbout, showContact }) {
  return (
    <footer className="site-footer">
      <div className="ft-grid">
        <div className="ft-blurb">
          <div className="logo"><span className="dot">&#9650;</span> Trailmind</div>
          <p>Voice-first travel planning that understands how you explore. Visually rich, budget-aware, honest about costs.</p>
        </div>

        <div className="ft-col">
          <h4>Product</h4>
          <a onClick={showExplore} style={{ cursor: 'pointer' }}>Explore destinations</a>
          <a onClick={showPlanner} style={{ cursor: 'pointer' }}>Plan a Trip</a>
        </div>

        <div className="ft-col">
          <h4>Company</h4>
          <a onClick={showAbout} style={{ cursor: 'pointer' }}>About us</a>
          <a onClick={showContact} style={{ cursor: 'pointer' }}>Contact</a>
        </div>

        <div className="ft-col">
          <h4>Support</h4>
          <a href="#">Help centre</a>
          <a href="#">Privacy policy</a>
          <a href="#">Terms of service</a>
          <a onClick={showContact} style={{ cursor: 'pointer' }}>Feedback</a>
        </div>
      </div>
      <div className="ft-bottom">&copy; 2026 Trailmind. All rights reserved.</div>
    </footer>
  );
}
