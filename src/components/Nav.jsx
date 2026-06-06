export default function Nav({ showExplore, showPlanner, showExperience, showVoicePage, showAdventure, user, openAuth, logout }) {
  return (
    <nav className="site-nav">
      <div className="wrap nav-in">
        <div className="logo" onClick={showExplore} style={{ cursor: 'pointer' }}>
          <span className="dot">&#9650;</span> Trailmind
        </div>

        <div className="nav-links">
          <a onClick={showExplore} style={{ cursor: 'pointer' }}>Explore</a>
          <a onClick={showPlanner} style={{ cursor: 'pointer' }}>AI Planner</a>
          <a onClick={showExperience} style={{ cursor: 'pointer' }}>Experience Center</a>
          <a onClick={showVoicePage} style={{ cursor: 'pointer' }}>Plan by Voice</a>
          <a onClick={showAdventure} style={{ cursor: 'pointer', color: '#e05a2b', fontWeight: 600 }}>Adventure AI</a>
        </div>

        <div className="nav-cta">
          {user ? (
            <div className="nav-user">
              <div className="uav">{user.name.charAt(0).toUpperCase()}</div>
              <span className="uname">{user.name}</span>
              <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '12px', marginLeft: 8 }} onClick={logout}>Log out</button>
            </div>
          ) : (
            <>
              <button className="btn btn-ghost" style={{ padding: '10px 22px', fontSize: '13px' }} onClick={() => openAuth('login')}>Log in</button>
              <button className="btn btn-coral" style={{ padding: '10px 22px', fontSize: '13px' }} onClick={() => openAuth('signup')}>Start free</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
