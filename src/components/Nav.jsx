import { useState } from 'react';

export default function Nav({ showExplore, showPlanner, showAbout, showMyTrips, showVoicePage, showExperience, showAdventure, showSavedTrips, user, openAuth, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (fn) => { fn(); setMenuOpen(false); };

  return (
    <nav className="site-nav">
      <div className="wrap nav-in">
        <div className="logo" onClick={() => go(showExplore)} style={{ cursor: 'pointer' }}>
          <span className="dot">&#9650;</span> Trailmind
        </div>

        <div className="nav-links">
          <a onClick={() => go(showExplore)} style={{ cursor: 'pointer' }}>Explore</a>
          <a onClick={() => go(showPlanner)} style={{ cursor: 'pointer' }}>AI Planner</a>
          <a onClick={() => go(showVoicePage)} style={{ cursor: 'pointer' }}>Plan by Voice</a>
          <a onClick={() => go(showExperience)} style={{ cursor: 'pointer' }}>Experience</a>
          <a onClick={() => go(showAdventure)} style={{ cursor: 'pointer', color: 'var(--color-coral)', fontWeight: 700 }}>Adventure AI</a>
          {user && <a onClick={() => go(showSavedTrips)} style={{ cursor: 'pointer' }}>My Trips</a>}
          <a onClick={() => go(showAbout)} style={{ cursor: 'pointer' }}>About</a>
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

        <button className={`hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <a onClick={() => go(showExplore)}>Explore</a>
          <a onClick={() => go(showPlanner)}>AI Planner</a>
          <a onClick={() => go(showVoicePage)}>Plan by Voice</a>
          <a onClick={() => go(showExperience)}>Experience</a>
          <a onClick={() => go(showAdventure)} style={{ color: 'var(--color-coral)', fontWeight: 700 }}>Adventure AI</a>
          {user && <a onClick={() => go(showSavedTrips)}>My Trips</a>}
          <a onClick={() => go(showAbout)}>About</a>
          <div className="mobile-auth">
            {user ? (
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--color-line)' }} onClick={() => { logout(); setMenuOpen(false); }}>Log out</button>
            ) : (
              <>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--color-line)' }} onClick={() => { openAuth('login'); setMenuOpen(false); }}>Log in</button>
                <button className="btn btn-coral" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { openAuth('signup'); setMenuOpen(false); }}>Start free</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
