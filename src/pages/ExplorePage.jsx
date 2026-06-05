import { useState } from 'react';
import { CITIES, STYLES, img, placeholderBg } from '../data.js';

const REGIONS = ['All', 'Asia', 'Europe', 'Middle East', 'Africa', 'Americas'];

export default function ExplorePage({ openCity, showPlanner, showVoicePage, toast }) {
  const [activeRegion, setActiveRegion] = useState('All');
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = () => {
    if (inputVal.trim()) {
      showVoicePage(inputVal.trim());
    } else {
      showVoicePage();
    }
  };

  const filtered = activeRegion === 'All' ? CITIES : CITIES.filter(c => c.region === activeRegion);

  const WHY_ITEMS = [
    { ic: '🎤', t: 'Plan by talking', d: 'Describe your trip in plain language and get a complete, costed itinerary. No forms, no twenty open tabs.', vs: 'vs. manual list-building' },
    { ic: '💸', t: 'Real, itemised cost', d: 'Activities, stay, food, transport and buffer — priced per person before you book.', vs: 'vs. "price on request"' },
    { ic: '🏚', t: 'Budget or luxury', d: 'One tap reshapes the whole trip and its hotels to your spend level.', vs: 'vs. one-size-fits-all' },
    { ic: '🧗', t: 'See yourself there', d: 'Drop your face into the activity and preview it before you commit.', vs: 'nobody else has this' },
  ];

  return (
    <>
      <section className="hero-home">
        <div className="wrap hero-in">
          <div>
            <h1>Just <span className="hl">talk</span>.<br/>We'll plan the whole adventure.</h1>
            <p className="sub">No forms. Tell Trailmind where you're dreaming of and how you like to travel {'—'} our AI builds a costed, day-by-day trip in under two minutes.</p>
            <div className="hero-cta">
              <button className="btn btn-coral" onClick={() => showVoicePage()}>{'🎤'} Start talking</button>
              <button className="btn btn-ghost" style={{border:'1px solid var(--color-line)'}} onClick={() => window.scrollTo({top: document.querySelector('.explore-head')?.offsetTop || 0, behavior: 'smooth'})}>Explore destinations {'→'}</button>
            </div>
            <div className="pill-stat">
              <div><b>AI-powered</b>real plans</div>
              <div><b>Costed</b>per person</div>
              <div><b>120+</b>destinations</div>
            </div>
          </div>

          <div className="voice-card">
            <div className="vc-top">
              <span className="ttl">{'✦'} Trailmind AI</span>
              <span className="live">POWERED BY CLAUDE</span>
            </div>

            <div className="vc-q" style={{ marginTop: 24, fontSize: 18 }}>Where do you want to go?</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '8px 0 20px' }}>
              Describe your dream trip {'—'} destination, budget, style, duration {'—'} and our AI will plan every detail.
            </p>

            <div className="vc-input-wrap">
              <input
                className="vc-input"
                placeholder="e.g. A week in Japan, love food, ~$2000 budget..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              />
              <button
                className="vc-mic-btn"
                onClick={handleSubmit}
                title="Start planning"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>

            <div className="vc-suggestions">
              <button onClick={() => showVoicePage('Week in Tokyo, mid-range, food and culture')}>Tokyo food trip</button>
              <button onClick={() => showVoicePage('5 days in Dubai, luxury, adventure activities')}>Dubai luxury</button>
              <button onClick={() => showVoicePage('10 days backpacking Southeast Asia on a budget')}>SE Asia backpack</button>
            </div>
          </div>
        </div>
      </section>

      <section className="styles">
        <div className="wrap styles-in">
          <h2>Find the adventure that fits you</h2>
          <p className="lead">Not sure where to go? Start with the kind of trip you're craving {'—'} we'll match it to destinations.</p>
          <div className="style-grid">
            {STYLES.map((s) => (
              <div className="style-card" key={s.t} onClick={() => toast('Filtered by ' + s.t)}>
                <div className="ph" style={{ background: placeholderBg(s.q) }}>
                  <img
                    src={img(s.q)}
                    alt={s.t}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="overlay" />
                <div className="body">
                  <div className="ic">{s.ic}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                  <div className="go">Explore {'→'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="explore-head">
          <h1>Discover incredible destinations waiting in every part of the planet</h1>
          <p>Pick a city, see the best things to do, and build a trip in minutes.</p>
        </div>
        <div className="tabs">
          {REGIONS.map((r) => (
            <button
              key={r}
              className={'tab' + (activeRegion === r ? ' active' : '')}
              onClick={() => setActiveRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="dest-grid">
          {filtered.map((c) => (
            <div className="card" key={c.name} onClick={() => openCity(c.name)}>
              <div className="ph" style={{ background: placeholderBg(c.q) }}>
                <img
                  src={img(c.q)}
                  alt={c.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="overlay" />
              <div className="count">{c.acts.length} things to do</div>
              <div className="meta">
                <div className="name">{c.name}</div>
                <div className="sub">{c.country}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="why"><div className="wrap">
        <div className="wh">
          <h2>Why travellers pick Trailmind</h2>
          <p className="lead">Every other planner gives the same list to everyone. Trailmind asks who you are first {'—'} then prices the whole trip.</p>
        </div>
        <div className="why-grid">
          {WHY_ITEMS.map((w) => (
            <div className="why-card" key={w.t}>
              <div className="ic">{w.ic}</div>
              <h3>{w.t}</h3>
              <p>{w.d}</p>
              <div className="vs">{w.vs}</div>
            </div>
          ))}
        </div>
      </div></div>
    </>
  );
}
