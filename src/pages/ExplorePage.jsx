import { useState, useRef, useEffect } from 'react';
import { CITIES, STYLES, VQ, img, placeholderBg, pickRegionFrom, mapBudgetTier, validateVoiceAnswer } from '../data.js';

const REGIONS = ['All', 'Asia', 'Europe', 'Middle East', 'Africa', 'Americas'];

export default function ExplorePage({ openCity, showPlanner, showVoicePage, toast }) {
  const [activeRegion, setActiveRegion] = useState('All');

  // ── Voice card state ──
  const [vIdx, setVIdx] = useState(-1); // -1 = idle, 0-4 = question index, 5 = done
  const [vAns, setVAns] = useState({});
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputVal, setInputVal] = useState('');
  const recognRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recog = new SR();
      recog.lang = 'en-US';
      recog.interimResults = true;
      recog.onresult = (e) => {
        const text = Array.from(e.results).map(r => r[0].transcript).join('');
        setTranscript(text);
        if (e.results[e.results.length - 1].isFinal) {
          answer(text);
        }
      };
      recog.onend = () => setListening(false);
      recognRef.current = recog;
    }
    synthRef.current = window.speechSynthesis || null;
  }, []);

  // Speak a question
  const speak = (text) => {
    if (synthRef.current) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.05;
      synthRef.current.speak(utt);
    }
  };

  // Start the orb tap flow
  const orbTap = () => {
    if (vIdx === -1) {
      setVIdx(0);
      speak(VQ[0].q);
      return;
    }
    if (recognRef.current && !listening) {
      setListening(true);
      setTranscript('');
      try { recognRef.current.start(); } catch (_) { /* already started */ }
    }
  };

  // Answer a question (with validation)
  const answer = (text) => {
    if (vIdx < 0 || vIdx >= VQ.length) return;

    // Validate the answer is relevant to the question
    if (!validateVoiceAnswer(vIdx, text)) {
      toast('That doesn\'t seem to match the question. Try again or pick an option below.');
      setTranscript('');
      setListening(false);
      if (recognRef.current) try { recognRef.current.stop(); } catch (_) {}
      return;
    }

    setVAns((prev) => ({ ...prev, [vIdx]: text }));
    setTranscript('');
    setInputVal('');
    setListening(false);
    if (recognRef.current) try { recognRef.current.stop(); } catch (_) {}

    const next = vIdx + 1;
    if (next < VQ.length) {
      setVIdx(next);
      speak(VQ[next].q);
    } else {
      setVIdx(5);
      speak('Great! Here is your travel profile.');
    }
  };

  const handleInputKey = (e) => {
    if (e.key === 'Enter' && inputVal.trim()) {
      answer(inputVal.trim());
    }
  };

  // Finish voice and filter
  const finishVoice = () => {
    const trip = vAns[0] || '';
    const region = pickRegionFrom(trip);
    if (region) setActiveRegion(region);
    const tier = mapBudgetTier(vAns[2] || '');
    toast(`Profile set — ${tier} tier, showing ${region || 'all'} destinations`);
    setVIdx(-1);
    setVAns({});
  };

  const filtered = activeRegion === 'All' ? CITIES : CITIES.filter(c => c.region === activeRegion);

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-home">
        <div className="wrap hero-in">
          <div>
            <h1>Just <span className="hl">talk</span>.<br/>We'll plan the whole adventure.</h1>
            <p className="sub">No forms. Tell Trailmind where you're dreaming of and how you like to travel — it builds a costed, day-by-day trip in under two minutes.</p>
            <div className="hero-cta">
              <button className="btn btn-coral" onClick={orbTap}>🎙 Start talking</button>
              <button className="btn btn-ghost" style={{border:'1px solid var(--color-line)'}} onClick={() => window.scrollTo({top: document.querySelector('.explore-head')?.offsetTop || 0, behavior: 'smooth'})}>Explore destinations →</button>
            </div>
            <div className="pill-stat">
              <div><b>2 min</b>avg plan time</div>
              <div><b>87%</b>avg match score</div>
              <div><b>120+</b>destinations</div>
            </div>
          </div>

          {/* ── Voice Card ── */}
          <div className="voice-card">
            <div className="vc-top">
              <span className="ttl">✦ Trailmind Voice</span>
              {listening && <span className="live">LISTENING</span>}
            </div>

            <div className="orb-wrap">
              <div className={`orb${listening ? ' listening' : ''}`} onClick={orbTap}>
                <div className="ring" />
              </div>
            </div>

            <div className={`waves${listening ? ' on' : ''}`}>
              <span /><span /><span /><span /><span />
            </div>

            {vIdx === -1 && (
              <>
                <div className="vc-status">Tap the orb to start</div>
                <div className="vc-q">Tell me about your dream trip</div>
              </>
            )}

            {vIdx >= 0 && vIdx < VQ.length && (
              <>
                <div className="vc-status">{listening ? 'Listening...' : 'Tap orb or pick below'}</div>
                <div className="vc-q">{VQ[vIdx].q}</div>
                {transcript && <div className="vc-transcript">{transcript}</div>}
                <div className="vc-chips">
                  {VQ[vIdx].chips.map((c) => (
                    <button key={c} className="vc-chip" onClick={() => answer(c)}>{c}</button>
                  ))}
                </div>
                <div className="vc-dots">
                  {VQ.map((_, i) => (
                    <i key={i} className={i <= vIdx ? 'active' : ''} />
                  ))}
                </div>
                <div className="vc-input-wrap">
                  <input
                    className="vc-input"
                    placeholder="Type your answer..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleInputKey}
                  />
                  <button
                    className={'vc-mic-btn' + (listening ? ' active' : '')}
                    onClick={orbTap}
                    title={listening ? 'Listening...' : 'Speak'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </button>
                </div>
              </>
            )}

            {vIdx === 5 && (
              <div className="vc-summary">
                <strong style={{ display: 'block', marginBottom: '8px' }}>Your travel profile</strong>
                {Object.entries(vAns).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: '4px' }}>
                    <span style={{ opacity: 0.5 }}>{VQ[k]?.q.replace('?', '')}: </span>{v}
                  </div>
                ))}
                <button
                  className="btn btn-coral"
                  style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}
                  onClick={finishVoice}
                >
                  See matches
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
          <p className="lead">Not sure where to go? Start with the kind of trip you're craving — we'll match it to destinations.</p>
          <div className="style-grid">
            {STYLES.map((s) => (
              <div className="style-card" key={s.t} onClick={() => toast(`Filtered by ${s.t}`)}>
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
                  <div className="go">Explore &rarr;</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPLORE DESTINATIONS ── */}
      <div className="wrap">
        <div className="explore-head">
          <h1>Discover incredible destinations waiting in every part of the planet</h1>
          <p>Pick a city, see the best things to do, and build a trip in minutes.</p>
        </div>
        <div className="tabs">
          {REGIONS.map((r) => (
            <button
              key={r}
              className={`tab${activeRegion === r ? ' active' : ''}`}
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
            { ic: '🧗', t: 'See yourself there', d: 'Drop your face into the activity and preview it before you commit.', vs: 'nobody else has this' },
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
