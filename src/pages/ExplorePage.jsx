import { useState, useRef, useEffect } from 'react';
import { CITIES, STYLES, VQ, img, placeholderBg, pickRegionFrom, mapBudgetTier } from '../data.js';

const REGIONS = [
  { label: 'All', emoji: '🌍' },
  { label: 'Asia', emoji: '🌏' },
  { label: 'Europe', emoji: '🏰' },
  { label: 'Middle East', emoji: '🕌' },
  { label: 'Africa', emoji: '🦁' },
  { label: 'Americas', emoji: '🌎' },
];

// Derive vibe from activity types
const getVibe = (city) => {
  const types = city.acts.map(a => a.type);
  if (types.includes('Adrenaline') || types.filter(t => t === 'Adventure').length >= 2) return { label: 'Adventure', emoji: '🏄' };
  if (types.filter(t => t === 'Culture' || t === 'Art').length >= 2) return { label: 'Culture', emoji: '🏛' };
  if (types.filter(t => t === 'Food').length >= 2) return { label: 'Food & Drink', emoji: '🍜' };
  if (types.includes('Landmark')) return { label: 'City Break', emoji: '🌆' };
  return { label: 'Explorer', emoji: '🗺' };
};

// Derive starting price from region
const getStartPrice = (city) => {
  const prices = { 'Asia': 600, 'Middle East': 900, 'Europe': 800, 'Africa': 700, 'Americas': 750 };
  return prices[city.region] || 700;
};

// Average rating from acts
const getAvgRating = (city) => {
  const ratings = city.acts.map(a => parseFloat(a.rating)).filter(Boolean);
  if (!ratings.length) return null;
  return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
};

export default function ExplorePage({ openCity, showPlanner, toast }) {
  const [activeRegion, setActiveRegion] = useState('All');
  const [hovered, setHovered] = useState(null);

  // ── Voice card state ──
  const [vIdx, setVIdx] = useState(-1);
  const [vAns, setVAns] = useState({});
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confirmedAnswer, setConfirmedAnswer] = useState(''); // shows captured answer before advancing
  const [inputVal, setInputVal] = useState('');
  const synthRef = useRef(null);
  const vIdxRef = useRef(-1);
  const answerRef = useRef(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis || null;
  }, []);

  useEffect(() => { vIdxRef.current = vIdx; }, [vIdx]);

  const speak = (text, onEnd) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.0;
      if (onEnd) utt.onend = onEnd;
      synthRef.current.speak(utt);
    } else if (onEnd) {
      onEnd();
    }
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.lang = 'en-US';
    recog.interimResults = true;
    recog.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(text);
      if (e.results[e.results.length - 1].isFinal) {
        recog.stop();
        answerRef.current(text);
      }
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    setListening(true);
    setTranscript('');
    recog.start();
  };

  const answer = (text) => {
    const currentIdx = vIdxRef.current;
    if (currentIdx < 0 || currentIdx >= VQ.length) return;

    // Show confirmed answer for 1.5s before advancing
    setConfirmedAnswer(text);
    setTranscript('');
    setInputVal('');
    setListening(false);
    setVAns((prev) => ({ ...prev, [currentIdx]: text }));

    setTimeout(() => {
      setConfirmedAnswer('');
      const next = currentIdx + 1;
      if (next < VQ.length) {
        setVIdx(next);
        // Speak next question, then auto-start listening
        speak(VQ[next].q, () => setTimeout(startListening, 400));
      } else {
        setVIdx(5);
        speak('Great! Here is your travel profile.');
      }
    }, 1500);
  };

  useEffect(() => { answerRef.current = answer; });

  const orbTap = () => {
    if (vIdxRef.current === -1) {
      setVIdx(0);
      // Speak first question then auto-start listening
      speak(VQ[0].q, () => setTimeout(startListening, 400));
      return;
    }
    if (!listening && confirmedAnswer === '') startListening();
  };

  const handleInputKey = (e) => {
    if (e.key === 'Enter' && inputVal.trim()) answer(inputVal.trim());
  };

  const finishVoice = () => {
    const trip = vAns[0] || '';
    const region = pickRegionFrom(trip);
    if (region) setActiveRegion(region);
    const tier = mapBudgetTier(vAns[2] || '');
    toast(`Profile set — ${tier} tier, showing ${region || 'all'} destinations`);
    setVIdx(-1); setVAns({});
  };

  const filtered = activeRegion === 'All' ? CITIES : CITIES.filter(c => c.region === activeRegion);

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-home">
        <div className="wrap hero-in">
          <div>
            <h1>Just <span className="hl">talk</span>.<br />We'll plan the whole adventure.</h1>
            <p className="sub">No forms. Tell Trailmind where you're dreaming of and how you like to travel — it builds a costed, day-by-day trip in under two minutes.</p>
            <div className="hero-cta">
              <button className="btn btn-coral" onClick={orbTap}>🎙 Start talking</button>
              <button className="btn btn-ghost" style={{ border: '1px solid var(--color-line)' }} onClick={() => window.scrollTo({ top: document.querySelector('.explore-section')?.offsetTop || 0, behavior: 'smooth' })}>Explore destinations →</button>
            </div>
            <div className="pill-stat">
              <div><b>12</b> handpicked cities</div>
              <div><b>60</b> curated activities</div>
              <div><b>3</b> budget tiers</div>
            </div>
          </div>

          {/* Voice Card */}
          <div className="voice-card">
            <div className="vc-top">
              <span className="ttl">✦ Trailmind Voice</span>
              {listening && <span className="live">LISTENING</span>}
              {confirmedAnswer && <span className="vc-confirmed-badge">✓ Got it</span>}
            </div>

            <div className="orb-wrap">
              <div className={`orb${listening ? ' listening' : ''}${confirmedAnswer ? ' confirmed' : ''}`} onClick={orbTap}>
                <div className="ring" />
              </div>
            </div>

            {/* Orb hint label */}
            {vIdx === -1 && <div className="vc-orb-hint">Tap to start</div>}
            {vIdx >= 0 && vIdx < VQ.length && !listening && !confirmedAnswer && (
              <div className="vc-orb-hint">Tap to speak</div>
            )}
            {listening && <div className="vc-orb-hint listening-hint">🎙 Listening… speak now</div>}
            {confirmedAnswer && <div className="vc-orb-hint">Moving to next question…</div>}

            <div className={`waves${listening ? ' on' : ''}`}>
              <span /><span /><span /><span /><span />
            </div>

            {/* Idle state */}
            {vIdx === -1 && (
              <div className="vc-q">Tell me about your dream trip</div>
            )}

            {/* Question flow */}
            {vIdx >= 0 && vIdx < VQ.length && (
              <>
                {/* Progress dots */}
                <div className="vc-dots">
                  {VQ.map((_, i) => (<i key={i} className={i < vIdx ? 'done' : i === vIdx ? 'active' : ''} />))}
                </div>

                <div className="vc-q">{VQ[vIdx].q}</div>

                {/* Live transcript while speaking */}
                {transcript && !confirmedAnswer && (
                  <div className="vc-transcript">"{transcript}"</div>
                )}

                {/* Confirmed answer display */}
                {confirmedAnswer && (
                  <div className="vc-captured">
                    <span className="vc-captured-label">✓ Heard</span>
                    <span className="vc-captured-text">"{confirmedAnswer}"</span>
                  </div>
                )}

                {/* Quick-pick chips */}
                {!confirmedAnswer && (
                  <>
                    <div className="vc-chips">
                      {VQ[vIdx].chips.map((c) => (
                        <button key={c} className="vc-chip" onClick={() => answer(c)}>{c}</button>
                      ))}
                    </div>
                    <input
                      className="vc-input"
                      placeholder="Or type and press Enter…"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={handleInputKey}
                    />
                  </>
                )}
              </>
            )}

            {/* Summary */}
            {vIdx === 5 && (
              <div className="vc-summary">
                <strong style={{ display: 'block', marginBottom: '8px' }}>Your travel profile</strong>
                {Object.entries(vAns).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: '4px' }}>
                    <span style={{ opacity: 0.5 }}>{VQ[k]?.q.replace('?', '')}: </span>{v}
                  </div>
                ))}
                <button className="btn btn-coral" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }} onClick={finishVoice}>
                  See matches →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ADVENTURE STYLES ── */}
      <section className="styles">
        <div className="wrap styles-in">
          <h2>Find the adventure that fits you</h2>
          <p className="lead">Not sure where to go? Start with the kind of trip you're craving.</p>
          <div className="style-grid">
            {STYLES.map((s) => (
              <div className="style-card" key={s.t} onClick={() => toast(`Filtered by ${s.t}`)}>
                <div className="ph" style={{ background: placeholderBg(s.q) }}>
                  <img src={img(s.q)} alt={s.t} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                <div className="overlay" />
                <div className="body">
                  <div className="ic">{s.ic}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                  <div className="go">Explore &rarr;</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPLORE DESTINATIONS ── */}
      <div className="explore-section">
        <div className="wrap">
          <div className="explore-head-new">
            <div>
              <h2 className="explore-title">Explore destinations</h2>
              <p className="explore-sub">Hand-picked cities across the world — click any to build your trip.</p>
            </div>
            <button className="btn btn-coral" style={{ fontSize: 14, padding: '12px 24px' }} onClick={showPlanner}>
              ✦ Build a custom plan
            </button>
          </div>

          {/* Region Filter */}
          <div className="region-tabs">
            {REGIONS.map((r) => (
              <button
                key={r.label}
                className={`region-tab${activeRegion === r.label ? ' active' : ''}`}
                onClick={() => setActiveRegion(r.label)}
              >
                <span className="region-emoji">{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="dest-grid-new">
            {filtered.map((c) => {
              const vibe = getVibe(c);
              const price = getStartPrice(c);
              const rating = getAvgRating(c);
              return (
                <div
                  className={`dest-card${hovered === c.name ? ' hovered' : ''}`}
                  key={c.name}
                  onClick={() => openCity(c.name)}
                  onMouseEnter={() => setHovered(c.name)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="dest-card-img" style={{ background: placeholderBg(c.q) }}>
                    <img
                      src={img(c.q)}
                      alt={c.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="dest-card-overlay" />
                    <div className="dest-card-vibe">
                      <span>{vibe.emoji}</span> {vibe.label}
                    </div>
                    {rating && (
                      <div className="dest-card-rating">⭐ {rating}</div>
                    )}
                  </div>
                  <div className="dest-card-body">
                    <div className="dest-card-top">
                      <div>
                        <div className="dest-card-city">{c.name}</div>
                        <div className="dest-card-country">{c.country}</div>
                      </div>
                      <div className="dest-card-price">From ${price}</div>
                    </div>
                    <div className="dest-card-footer">
                      <span className="dest-card-acts">{c.acts.length} activities</span>
                      <span className="dest-card-cta">Plan this trip →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── WHY TRAILMIND ── */}
      <div className="why"><div className="wrap">
        <div className="wh">
          <h2>Why travellers pick Trailmind</h2>
          <p className="lead">Every other planner gives the same list to everyone. Trailmind asks who you are first — then prices the whole trip.</p>
        </div>
        <div className="why-grid">
          {[
            { ic: '🎙', t: 'Plan by talking', d: 'Speak five answers and get a complete trip. No forms, no twenty open tabs.', vs: 'vs. manual list-building' },
            { ic: '💸', t: 'Real, itemised cost', d: 'Activities, stay, food, transport and buffer — priced per person before you book.', vs: 'vs. "price on request"' },
            { ic: '🎚', t: 'Budget or luxury', d: 'One tap reshapes the whole trip and its hotels to your spend level.', vs: 'vs. one-size-fits-all' },
          ].map((w) => (
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
