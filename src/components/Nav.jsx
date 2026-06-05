import { CURRENCY_CODES, CURRENCIES } from '../data.js';

export default function Nav({ showExplore, showPlanner, showExperience, showVoicePage, user, openAuth, currency, setCurrency }) {
  return (
    <nav className="site-nav">
      <div className="wrap nav-in">
        <div className="logo" onClick={showExplore} style={{ cursor: 'pointer' }}>
          <span className="dot">&#9650;</span> Trailmind
        </div>

        <div className="nav-links">
          <a onClick={showExplore} style={{ cursor: 'pointer' }}>Explore</a>
          <a onClick={showPlanner} style={{ cursor: 'pointer' }}>AI Planner</a>
          <a onClick={showExperience} style={{ cursor: 'pointer' }}>Experience Center <span style={{ fontSize: 9, background: 'var(--color-coral)', color: '#fff', padding: '2px 6px', borderRadius: 8, marginLeft: 4, verticalAlign: 'super', fontWeight: 700, letterSpacing: '.5px' }}>SOON</span></a>
          <a onClick={showVoicePage} style={{ cursor: 'pointer' }}>Plan by Voice</a>
        </div>

        <div className="nav-cta">
          <select
            className="cur-sel"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
          >
            {CURRENCY_CODES.map(c => (
              <option key={c} value={c}>{CURRENCIES[c].symbol} {c}</option>
            ))}
          </select>
          {user ? (
            <div className="nav-user">
              <div className="uav">{user.name.charAt(0).toUpperCase()}</div>
              <span className="uname">{user.name}</span>
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
