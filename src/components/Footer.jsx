export default function Footer({ showExplore, showPlanner, showExperience, showVoicePage, showAbout, showContact }) {
  return (
    <footer className="site-footer">
      <div className="ft-grid">
        <div className="ft-blurb">
          <div className="logo"><span className="dot">&#9650;</span> Trailmind</div>
          <p>AI-powered travel planning that understands how you explore. Voice-first, visually rich, budget-aware.</p>
        </div>

        <div className="ft-col">
          <h4>Product</h4>
          <a onClick={showExplore} style={{ cursor: 'pointer' }}>Explore destinations</a>
          <a onClick={showPlanner} style={{ cursor: 'pointer' }}>AI Planner</a>
          <a onClick={showExperience} style={{ cursor: 'pointer' }}>Experience Center</a>
          <a onClick={showVoicePage} style={{ cursor: 'pointer' }}>Plan by Voice</a>
        </div>

        <div className="ft-col">
          <h4>Company</h4>
          <a onClick={showAbout} style={{ cursor: 'pointer' }}>About us</a>
          <a onClick={showContact} style={{ cursor: 'pointer' }}>Contact</a>
          <a href="#">Careers</a>
          <a href="#">Press</a>
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
