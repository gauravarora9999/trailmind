import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function Nav({ showExplore, showPlanner, showAbout, showMyTrips, showVoicePage, showExperience, showAdventure, showSavedTrips, user, openAuth, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;

  const go = (fn) => { fn(); setMenuOpen(false); };

  const link = (label, fn, route) => (
    <a
      onClick={() => go(fn)}
      style={{ cursor: 'pointer' }}
      className={path === route ? 'nav-active' : ''}
    >
      {label}
    </a>
  );

  return (
    <nav className="site-nav">
      <div className="wrap nav-in">
        <div className="logo" onClick={() => go(showExplore)} style={{ cursor: 'pointer' }}>
          <span className="dot">&#9650;</span> Trailmind
        </div>

        <div className="nav-links">
          {link('Explore', showExplore, '/')}
          {link('Trip Planner', showPlanner, '/planner')}
          {link('Experience', showExperience, '/experience')}
          <a
            onClick={() => go(showAdventure)}
            style={{ cursor: 'pointer' }}
            className={`nav-adventure-link${path === '/adventure' ? ' nav-active' : ''}`}
          >
            Adventure AI
          </a>
          {user && link('My Trips', showMyTrips, '/my-trips')}
          {link('About', showAbout, '/about')}
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
          {link('Explore', showExplore, '/')}
          {link('Trip Planner', showPlanner, '/planner')}
          {link('Experience', showExperience, '/experience')}
          <a
            onClick={() => go(showAdventure)}
            className={`nav-adventure-link${path === '/adventure' ? ' nav-active' : ''}`}
          >
            Adventure AI
          </a>
          {user && link('My Trips', showMyTrips, '/my-trips')}
          {link('About', showAbout, '/about')}
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
