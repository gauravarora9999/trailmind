import { useState } from 'react';

export default function Nav({ showExplore, showPlanner, showExperience, showVoicePage, showAdventure, showSavedTrips, showAbout, showContact, user, openAuth, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const nav = (fn) => { fn(); close(); };

  return (
    <nav className="site-nav">
      <div className="wrap nav-in">
        <div className="logo" onClick={() => nav(showExplore)} style={{ cursor: 'pointer' }}>
          <span className="dot">&#9650;</span> Trailmind
        </div>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <a onClick={() => nav(showExplore)}>Explore</a>
          <a onClick={() => nav(showPlanner)}>AI Planner</a>
          <a onClick={() => nav(showExperience)}>Experience Center</a>
          <a onClick={() => nav(showVoicePage)}>Plan by Voice</a>
          <a onClick={() => nav(showAdventure)} className="nav-adventure">Adventure AI</a>
          {user && <a onClick={() => nav(showSavedTrips)}>My Trips</a>}
          <div className="nav-mobile-auth">
            {user ? (
              <button className="btn btn-ghost" style={{ padding: '10px 22px', fontSize: '13px', width: '100%' }} onClick={() => { logout(); close(); }}>Log out</button>
            ) : (
              <>
                <button className="btn btn-ghost" style={{ padding: '10px 22px', fontSize: '13px', width: '100%' }} onClick={() => { openAuth('login'); close(); }}>Log in</button>
                <button className="btn btn-coral" style={{ padding: '10px 22px', fontSize: '13px', width: '100%', marginTop: 8 }} onClick={() => { openAuth('signup'); close(); }}>Start free</button>
              </>
            )}
          </div>
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

        <button className="nav-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span className={menuOpen ? 'open' : ''} />
          <span className={menuOpen ? 'open' : ''} />
          <span className={menuOpen ? 'open' : ''} />
        </button>
      </div>

      {menuOpen && <div className="nav-backdrop" onClick={close} />}
    </nav>
  );
}
