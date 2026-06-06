import { useState, useRef, useEffect } from 'react';
import { CITIES, STYLES, VQ, img, placeholderBg, pickRegionFrom, mapBudgetTier, mapDuration, mapGroup, DURATION_RANGES } from '../data.js';

const REGIONS = [
  { label: 'All', emoji: '🌍' },
  { label: 'Asia', emoji: '🌏' },
  { label: 'Europe', emoji: '🏰' },
  { label: 'Middle East', emoji: '🕌' },
  { label: 'Africa', emoji: '🦁' },
  { label: 'Americas', emoji: '🌎' },
];

const VIBE_FILTERS = [
  { label: 'Adventure', emoji: '🏄' },
  { label: 'Culture', emoji: '🏛' },
  { label: 'Food & Drink', emoji: '🍜' },
  { label: 'City Break', emoji: '🌆' },
];

const BUDGET_FILTERS = [
  { label: 'Budget', emoji: '💚', max: 650 },
  { label: 'Mid-range', emoji: '💛', max: 850 },
  { label: 'Luxury', emoji: '❤️', max: 9999 },
];

const DURATION_FILTERS = [
  { label: 'Weekend', emoji: '⚡', desc: '2–3 days' },
  { label: 'One Week', emoji: '📅', desc: '4–7 days' },
  { label: 'Two Weeks', emoji: '🗓', desc: '8–14 days' },
  { label: 'Extended', emoji: '✈️', desc: '14+ days' },
];


// Parse ALL 5 voice answers into filter values
const parseVoiceFilters = (vAns) => {
  const filters = {};
  // Q1: trip type → region (handled separately via pickRegionFrom)
  // Q2: duration
  const dur = mapDuration(vAns[1] || '');
  if (dur) filters.duration = dur;
  // Q3: budget
  const budget = mapBudgetTier(vAns[2] || '');
  if (budget) filters.budget = budget;
  // Q4: who's coming → group
  const group = mapGroup(vAns[3] || '');
  if (group) filters.group = group;
  // Q5: must-haves → vibe
  const must = (vAns[4] || '').toLowerCase();
  if (must.includes('adventure') || must.includes('trek') || must.includes('hike') || must.includes('sport')) filters.vibe = 'Adventure';
  else if (must.includes('culture') || must.includes('history') || must.includes('art') || must.includes('museum') || must.includes('historical')) filters.vibe = 'Culture';
  else if (must.includes('food') || must.includes('eat') || must.includes('cuisine')) filters.vibe = 'Food & Drink';
  else if (must.includes('city') || must.includes('shopping') || must.includes('nightlife')) filters.vibe = 'City Break';
  else if (must.includes('nature') || must.includes('wildlife')) filters.vibe = 'Adventure';
  return filters;
};

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

const HERO_TAGLINES = [
  'Make the best days of your life.',
  'Turn “someday” into a date on the calendar.',
  'Adventure, minus the spreadsheets.',
  'Your story — beautifully planned.',
];

export default function ExplorePage({ openCity, showPlanner, toast }) {
  const [activeRegion, setActiveRegion] = useState('All');
  const [activeVibe, setActiveVibe] = useState(null);
  const [activeBudget, setActiveBudget] = useState(null);
  const [activeDuration, setActiveDuration] = useState(null);
  const [voiceFilters, setVoiceFilters] = useState({});
  const [hovered, setHovered] = useState(null);

  // ── Cinematic hero: rotating tagline + ambient sound ──
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const ambientRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTaglineIdx(i => (i + 1) % HERO_TAGLINES.length), 3400);
    return () => clearInterval(t);
  }, []);

  const startAmbient = () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2.2);
    const chord = [220, 277.18, 329.63, 440];
    const oscs = chord.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = (i === 0 ? 0.10 : 0.05);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      o.connect(g); g.connect(lp); lp.connect(master);
      o.start();
      return o;
    });
    const notes = [587.33, 659.25, 783.99, 880, 987.77];
    const melodyTimer = setInterval(() => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = notes[Math.floor(Math.random() * notes.length)];
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 2.5);
    }, 2700);
    ambientRef.current = { ctx, oscs, master, melodyTimer };
  };

  const stopAmbient = () => {
    const a = ambientRef.current;
    if (!a) return;
    clearInterval(a.melodyTimer);
    try { a.master.gain.linearRampToValueAtTime(0, a.ctx.currentTime + 0.6); } catch (_) {}
    setTimeout(() => { try { a.oscs.forEach(o => o.stop()); a.ctx.close(); } catch (_) {} }, 700);
    ambientRef.current = null;
  };

  const toggleSound = () => {
    if (soundOn) { stopAmbient(); setSoundOn(false); }
    else { startAmbient(); setSoundOn(true); }
  };

  useEffect(() => () => stopAmbient(), []);

  // ── Voice card animated height ──
  const [cardHeight, setCardHeight] = useState(null);
  const innerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!innerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        setCardHeight(h + 56); // 28px padding top + bottom
      }
    });
    observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, []);

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
        answerRef.current(text, true); // fromVoice = true
      }
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    setListening(true);
    setTranscript('');
    recog.start();
  };

  const answer = (text, fromVoice = false) => {
    const currentIdx = vIdxRef.current;
    if (currentIdx < 0 || currentIdx >= VQ.length) return;

    setTranscript('');
    setInputVal('');
    setListening(false);
    setVAns((prev) => ({ ...prev, [currentIdx]: text }));

    // Show confirmation for all input types, 1.5s for voice, 800ms for manual
    const delay = fromVoice ? 1500 : 800;
    setConfirmedAnswer(text);

    setTimeout(() => {
      setConfirmedAnswer('');
      const next = currentIdx + 1;
      if (next < VQ.length) {
        setVIdx(next);
        speak(VQ[next].q, () => setTimeout(startListening, 400));
      } else {
        setVIdx(5);
        speak('Great! Here is your travel profile.');
      }
    }, delay);
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
    const parsed = parseVoiceFilters(vAns);
    setVoiceFilters(parsed);
    if (parsed.vibe) setActiveVibe(parsed.vibe);
    if (parsed.budget) setActiveBudget(parsed.budget);
    if (parsed.duration) setActiveDuration(parsed.duration);
    setVIdx(-1); setVAns({});
    setTimeout(() => {
      document.querySelector('.explore-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const clearAllFilters = () => {
    setActiveRegion('All');
    setActiveVibe(null);
    setActiveBudget(null);
    setActiveDuration(null);
    setVoiceFilters({});
  };

  // Soft match score — higher = better match, never removes cities
  const getMatchScore = (city) => {
    let score = 0;
    const vibe = getVibe(city);
    const price = getStartPrice(city);
    if (activeVibe && vibe.label === activeVibe) score += 3;
    if (activeBudget) {
      const bf = BUDGET_FILTERS.find(b => b.label === activeBudget);
      if (bf && price <= bf.max) score += 3;
    }
    if (activeDuration) {
      const dr = DURATION_RANGES[activeDuration];
      if (dr && city.minDays <= dr.max && city.maxDays >= dr.min) score += 3;
    }
    return score;
  };

  // Region = only hard filter. Vibe / Budget / Duration = soft ranking only
  const baseFiltered = activeRegion === 'All' ? CITIES : CITIES.filter(c => c.region === activeRegion);
  const filtered = [...baseFiltered].sort((a, b) => getMatchScore(b) - getMatchScore(a));
  const hasActiveFilters = activeRegion !== 'All' || activeVibe || activeBudget || activeDuration;
  // Best match = scored at least one soft filter
  const maxScore = filtered[0] ? getMatchScore(filtered[0]) : 0;

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-home hero-cinematic">
        <div className="hero-bg" aria-hidden="true">
          <video className="hero-video" autoPlay muted loop playsInline poster="https://assets.mixkit.co/videos/44370/44370-thumb-720-0.jpg">
            <source src="https://assets.mixkit.co/videos/44370/44370-720.mp4" type="video/mp4" />
            <source src="https://assets.mixkit.co/videos/44370/44370-360.mp4" type="video/mp4" />
          </video>
          <div className="hero-scrim" />
        </div>

        <button className={`hero-sound${soundOn ? ' on' : ''}`} onClick={toggleSound} aria-label={soundOn ? 'Mute ambient music' : 'Play ambient music'} title={soundOn ? 'Mute ambient music' : 'Play ambient music'}>
          <span className="hs-ico">{soundOn ? '♪' : '🔇'}</span>
          <span className="hs-bars" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="hs-txt">{soundOn ? 'Sound on' : 'Sound off'}</span>
        </button>

        <div className="wrap hero-in">
          <div>
            <div className="hero-kicker">✦ AI travel concierge</div>
            <h1>Just <span className="hl">talk</span>.<br />We'll plan the whole adventure.</h1>
            <p className="hero-rotator" key={taglineIdx}>{HERO_TAGLINES[taglineIdx]}</p>
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

          <div className="voice-card" ref={cardRef} style={{ height: cardHeight ? `${cardHeight}px` : 'auto' }}>
          <div className="vc-inner" ref={innerRef}>
            <div className="vc-top">
              <span className="ttl">✦ Trailmind Voice</span>
              {listening && <span className="live">LISTENING</span>}
              {confirmedAnswer && <span className="vc-confirmed-badge">✓ Captured</span>}
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
                    <span className="vc-captured-label">✓ Captured</span>
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
          </div>{/* end vc-inner */}
          </div>{/* end voice-card */}
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

          {/* Voice filter strip — shown after voice journey */}
          {Object.keys(voiceFilters).length > 0 && (
            <div className="voice-filter-strip">
              <span className="vf-label">🎙 Matched from your answers:</span>
              {voiceFilters.duration && <span className="vf-chip">{DURATION_FILTERS.find(d => d.label === voiceFilters.duration)?.emoji} {voiceFilters.duration}</span>}
              {voiceFilters.budget && <span className="vf-chip">{BUDGET_FILTERS.find(b => b.label === voiceFilters.budget)?.emoji} {voiceFilters.budget}</span>}
              {voiceFilters.vibe && <span className="vf-chip">{VIBE_FILTERS.find(v => v.label === voiceFilters.vibe)?.emoji} {voiceFilters.vibe}</span>}
              <button className="vf-clear" onClick={clearAllFilters}>✕ Clear</button>
            </div>
          )}

          {/* Filter Panel — 5 rows, one per filter */}
          <div className="smart-filter-panel">
            <div className="sf-row">
              <span className="sf-group-label">Region</span>
              {REGIONS.map((r) => (
                <button key={r.label} className={`sf-chip${activeRegion === r.label ? ' active' : ''}`} onClick={() => setActiveRegion(r.label)}>
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
            <div className="sf-row">
              <span className="sf-group-label">Vibe</span>
              {VIBE_FILTERS.map(v => (
                <button key={v.label} className={`sf-chip${activeVibe === v.label ? ' active' : ''}`} onClick={() => setActiveVibe(activeVibe === v.label ? null : v.label)}>
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>
            <div className="sf-row">
              <span className="sf-group-label">Budget</span>
              {BUDGET_FILTERS.map(b => (
                <button key={b.label} className={`sf-chip${activeBudget === b.label ? ' active' : ''}`} onClick={() => setActiveBudget(activeBudget === b.label ? null : b.label)}>
                  {b.emoji} {b.label}
                </button>
              ))}
            </div>
            <div className="sf-row">
              <span className="sf-group-label">Duration</span>
              {DURATION_FILTERS.map(d => (
                <button key={d.label} className={`sf-chip${activeDuration === d.label ? ' active' : ''}`} onClick={() => setActiveDuration(activeDuration === d.label ? null : d.label)}>
                  {d.emoji} {d.label} <span className="sf-chip-desc">{d.desc}</span>
                </button>
              ))}
              {hasActiveFilters && (
                <button className="sf-clear-btn" onClick={clearAllFilters}>✕ Clear all</button>
              )}
            </div>
          </div>

          {/* Results count */}
          {hasActiveFilters && (
            <div className="sf-results-count">
              {activeRegion !== 'All' ? <><b>{filtered.length}</b> destinations in {activeRegion}</> : <><b>{filtered.length}</b> destinations</>}
              {(activeVibe || activeBudget || activeDuration) && <> — sorted by best match</>}
            </div>
          )}

          {/* Cards Grid */}
          <div className="dest-grid-new">
            {filtered.map((c) => {
              const vibe = getVibe(c);
              const price = getStartPrice(c);
              const rating = getAvgRating(c);
              const score = getMatchScore(c);
              const isBestMatch = hasActiveFilters && maxScore > 0 && score === maxScore && score > 0;
              return (
                <div
                  className={`dest-card${hovered === c.name ? ' hovered' : ''}${isBestMatch ? ' best-match' : ''}`}
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
                    {isBestMatch && <div className="dest-card-best">⭐ Best match</div>}
                    {!isBestMatch && rating && (
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
        <div className="why-header">
          <div className="why-eyebrow">Why Trailmind</div>
          <h2>Built differently, on purpose</h2>
          <p className="why-sub">Every other planner gives the same list to everyone. Trailmind asks who you are first — then prices the whole trip.</p>
        </div>
        <div className="why-grid">
          {[
            { ic: '🎙️', t: 'Plan by talking', d: 'Speak five answers and get a complete trip. No forms, no twenty open tabs.', vs: 'vs. manual list-building' },
            { ic: '💸', t: 'Real, itemised cost', d: 'Activities, stay, food, transport and buffer — priced per person before you book.', vs: 'vs. "price on request"' },
            { ic: '🎚️', t: 'Budget or luxury', d: 'One tap reshapes the whole trip and its hotels to your spend level.', vs: 'vs. one-size-fits-all' },
          ].map((w) => (
            <div className="why-card" key={w.t}>
              <div className="why-card-ic">{w.ic}</div>
              <h3>{w.t}</h3>
              <p>{w.d}</p>
              <div className="vs">↗ {w.vs}</div>
            </div>
          ))}
        </div>
      </div></div>
    </>
  );
}
