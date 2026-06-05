import { useState, useRef, useEffect, useCallback } from 'react';
import { money } from '../data.js';

const SILENCE_TIMEOUT = 8000;
const WELCOME = "I'm Trailmind, your AI trip planner. I'll ask a few quick questions to build a costed, day-by-day itinerary.";
const OFF_TOPIC = "This is a focused trip-planning chat — I can only help with building your itinerary right now.";
const DONE_MSG = "Your trip plan is ready above! Click 'New chat' to plan another trip.";

const STEPS = [
  {
    key: 'destination',
    ask: 'Where would you like to go? Name a city or country.',
    retry: "I need a destination to plan your trip. Name a city or country — e.g. 'Tokyo', 'Peru', or 'Bali'.",
    ok: (v) => 'Got it — ' + v + '.',
    parse(t) {
      let c = t.trim()
        .replace(/^(i('d| would) like to (go to|visit)|let'?s go to|i want to go to|how about|maybe|take me to|thinking of|planning)\s+/i, '')
        .replace(/[.!?,]+$/, '').trim();
      return c.length >= 2 ? c.charAt(0).toUpperCase() + c.slice(1) : null;
    }
  },
  {
    key: 'duration',
    ask: 'How many days is your trip?',
    retry: "I need the trip length. Say a number like '5 days', '10', or 'a week'.",
    ok: (v) => v + ' days — noted.',
    parse(t) {
      const l = t.toLowerCase();
      if (/\b2\s*weeks?\b|\bfortnight\b/.test(l)) return 14;
      if (/\bweek\b/.test(l)) return 7;
      if (/\blong\s*weekend\b/.test(l)) return 4;
      if (/\bweekend\b/.test(l)) return 3;
      const m = l.match(/(\d+)/);
      if (m) { const n = parseInt(m[1]); if (n >= 1 && n <= 30) return n; }
      return null;
    }
  },
  {
    key: 'budget',
    ask: "What's your total budget per person (in USD)?",
    retry: "I need a budget amount. Say something like '$2000', '1500', or '3k'.",
    ok: (v) => '$' + v + ' per person — got it.',
    parse(t) {
      const l = t.toLowerCase().replace(/,/g, '');
      const k = l.match(/([\d.]+)\s*k\b/);
      if (k) { const n = Math.round(parseFloat(k[1]) * 1000); if (n >= 100 && n <= 100000) return n; }
      const m = l.match(/(\d+)/);
      if (m) { const n = parseInt(m[1]); if (n >= 100 && n <= 100000) return n; }
      return null;
    }
  },
  {
    key: 'style',
    ask: 'Travel style — Budget, Mid-range, or Luxury?',
    retry: 'Please pick one: Budget, Mid-range, or Luxury.',
    ok: (v) => v + ' style — perfect.',
    parse(t) {
      const l = t.toLowerCase();
      if (/budget|cheap|backpack|hostel|saving|frugal|low.cost/i.test(l)) return 'Budget';
      if (/mid|moderate|average|normal|standard|comfort|regular/i.test(l)) return 'Mid-range';
      if (/lux|premium|fancy|high.end|splurge|5.star|upscale|first.class/i.test(l)) return 'Luxury';
      return null;
    }
  },
  {
    key: 'travellers',
    ask: 'How many travellers?',
    retry: "Just the number of people — e.g. '2', 'solo', or 'couple'.",
    ok: (v) => v + ' traveller' + (v > 1 ? 's' : '') + ' — all set!',
    parse(t) {
      const l = t.toLowerCase();
      if (/\bsolo\b|\bjust me\b|\bmyself\b|\balone\b/.test(l)) return 1;
      if (/\bcouple\b|\btwo of us\b|\bpartner\b/.test(l)) return 2;
      if (/\bone\b|\b1\b/.test(l)) return 1;
      if (/\btwo\b|\b2\b/.test(l)) return 2;
      if (/\bthree\b|\b3\b/.test(l)) return 3;
      if (/\bfour\b|\b4\b/.test(l)) return 4;
      if (/\bfive\b|\b5\b/.test(l)) return 5;
      if (/\bsix\b|\b6\b/.test(l)) return 6;
      const m = l.match(/(\d+)/);
      if (m) { const n = parseInt(m[1]); if (n >= 1 && n <= 20) return n; }
      return null;
    }
  }
];

/* Try to extract multiple answers from a rich initial message */
function parseAll(text) {
  const found = {};
  const t = text.toLowerCase();

  if (/\b2\s*weeks?\b|\bfortnight\b/.test(t)) found.duration = 14;
  else if (/\bweek\b/.test(t)) found.duration = 7;
  else if (/\bweekend\b/.test(t)) found.duration = 3;
  else { const m = t.match(/(\d+)\s*days?\b/); if (m) { const n = parseInt(m[1]); if (n >= 1 && n <= 30) found.duration = n; } }

  if (/budget|cheap|backpack/i.test(t)) found.style = 'Budget';
  else if (/mid-?range|moderate/i.test(t)) found.style = 'Mid-range';
  else if (/luxury|luxurious|premium/i.test(t)) found.style = 'Luxury';

  const bm = t.replace(/,/g, '').match(/\$\s*([\d.]+)\s*k?\b/);
  if (bm) {
    let n = parseFloat(bm[1]);
    if (t.indexOf(bm[0]) >= 0 && /k/i.test(t.slice(t.indexOf(bm[0])))) n *= 1000;
    if (n >= 100 && n <= 100000) found.budget = Math.round(n);
  } else {
    const dm = t.replace(/,/g, '').match(/(\d+)\s*(?:dollars?|usd|bucks?)\b/i);
    if (dm) { const n = parseInt(dm[1]); if (n >= 100 && n <= 100000) found.budget = n; }
  }

  if (/\bsolo\b|\bjust me\b/.test(t)) found.travellers = 1;
  else if (/\bcouple\b|\btwo of us\b/.test(t)) found.travellers = 2;

  const dests = [
    /(?:in|to|visit|backpacking|exploring|through)\s+([A-Z][a-zA-Z\s]+?)(?:\s*[,.]|\s+(?:for|on|with|budget|mid|luxury|cheap|and|love|\d))/i,
    /(?:trip to|go to)\s+(.+?)(?:\s*[,.]|$)/i,
  ];
  for (const re of dests) {
    const m = text.match(re);
    if (m) { found.destination = m[1].trim(); break; }
  }

  return found;
}

function nextUnanswered(answers, from) {
  for (let i = from; i < STEPS.length; i++) {
    if (!(STEPS[i].key in answers)) return i;
  }
  return STEPS.length;
}

export default function VoicePage({ openPlanner, showExplore, toast, currency = 'USD', initialMessage = '' }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const recognRef = useRef(null);
  const synthRef = useRef(null);
  const chatEndRef = useRef(null);
  const sentInit = useRef(false);
  const silenceTimer = useRef(null);
  const finalTranscript = useRef('');
  const handleRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const speak = (text) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.05;
      synthRef.current.speak(utt);
    }
  };

  const botSay = (text) => {
    setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    speak(text);
  };

  const generatePlan = async (params) => {
    setLoading(true);
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripParams: params, currency }),
      });
      let data;
      try { data = await resp.json(); } catch { data = null; }
      if (data && data.plan && data.plan.city) {
        setPlan(data.plan);
        botSay(data.message || 'Here is your trip plan!');
      } else {
        botSay((data && data.message) || 'Sorry, I could not generate a plan right now. Click "New chat" to try again.');
      }
    } catch {
      botSay('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* Process a rich multi-field message (initial message or suggestion chip) */
  const processRichInput = (text) => {
    const parsed = parseAll(text);
    const merged = { ...answers, ...parsed };

    if (Object.keys(parsed).length === 0) {
      const dest = STEPS[0].parse(text);
      if (dest) merged.destination = dest;
    }

    setAnswers(merged);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    const parts = [];
    if (merged.destination) parts.push(merged.destination);
    if (merged.duration) parts.push(merged.duration + ' days');
    if (merged.budget) parts.push('$' + merged.budget);
    if (merged.style) parts.push(merged.style);
    if (merged.travellers) parts.push(merged.travellers + ' traveller(s)');

    const next = nextUnanswered(merged, 0);
    if (next >= STEPS.length) {
      const t = 'Got it: ' + parts.join(', ') + '. Generating your plan...';
      botSay(t);
      setStep(STEPS.length);
      generatePlan(merged);
    } else {
      const intro = parts.length > 0 ? 'Got it: ' + parts.join(', ') + '. Let me fill in the rest.\n\n' : '';
      botSay(intro + STEPS[next].ask);
      setStep(next);
    }
  };

  /* Handle single-step user input (answer to current question) */
  const handleUserInput = (text) => {
    if (!text.trim() || loading) return;
    const clean = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: clean }]);
    setInputVal('');

    if (step >= STEPS.length) {
      botSay(DONE_MSG);
      return;
    }

    const current = STEPS[step];
    const parsed = current.parse(clean);

    if (parsed !== null) {
      const newAnswers = { ...answers, [current.key]: parsed };
      setAnswers(newAnswers);
      const next = nextUnanswered(newAnswers, step + 1);

      if (next >= STEPS.length) {
        botSay(current.ok(parsed) + ' Generating your trip plan...');
        setStep(next);
        generatePlan(newAnswers);
      } else {
        botSay(current.ok(parsed) + '\n\n' + STEPS[next].ask);
        setStep(next);
      }
    } else {
      botSay(OFF_TOPIC + '\n\n' + current.retry);
    }
  };

  handleRef.current = handleUserInput;

  /* ---- Voice recording ---- */
  const stopRecording = useCallback(() => {
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
    if (recognRef.current) try { recognRef.current.stop(); } catch (_) {}
    setListening(false);
    const text = finalTranscript.current.trim();
    finalTranscript.current = '';
    if (text) { setTranscript(''); handleRef.current?.(text); }
  }, []);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(() => stopRecording(), SILENCE_TIMEOUT);
  }, [stopRecording]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recog = new SR();
      recog.lang = 'en-US';
      recog.continuous = true;
      recog.interimResults = true;
      recog.onresult = (e) => {
        let interim = '', final = '';
        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t + ' '; else interim += t;
        }
        if (final) finalTranscript.current = final.trim();
        setTranscript((final + interim).trim());
        resetSilenceTimer();
      };
      recog.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') toast('Mic error: ' + e.error);
        setListening(false);
        if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
      };
      recog.onend = () => {
        setListening(prev => {
          if (prev) {
            const text = finalTranscript.current.trim();
            finalTranscript.current = '';
            if (text) { setTranscript(''); handleRef.current?.(text); }
          }
          return false;
        });
        if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
      };
      recognRef.current = recog;
    }
    synthRef.current = window.speechSynthesis || null;
  }, []);

  /* ---- Mount: welcome or parse initial message ---- */
  useEffect(() => {
    if (sentInit.current) return;
    sentInit.current = true;

    if (initialMessage) {
      processRichInput(initialMessage);
    } else {
      const t = WELCOME + '\n\n' + STEPS[0].ask;
      setMessages([{ role: 'assistant', content: t }]);
      speak(t);
    }
  }, []);

  const toggleMic = () => {
    if (listening) { stopRecording(); return; }
    if (!recognRef.current) { toast('Speech recognition not supported in this browser'); return; }
    finalTranscript.current = '';
    setTranscript('');
    setListening(true);
    try { recognRef.current.start(); } catch (_) {}
    resetSilenceTimer();
  };

  const newChat = () => {
    if (synthRef.current) synthRef.current.cancel();
    setMessages([]);
    setPlan(null);
    setInputVal('');
    setLoading(false);
    setTranscript('');
    setStep(0);
    setAnswers({});
    if (listening) {
      if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
      if (recognRef.current) try { recognRef.current.stop(); } catch (_) {}
      setListening(false);
    }
    setTimeout(() => {
      const t = WELCOME + '\n\n' + STEPS[0].ask;
      setMessages([{ role: 'assistant', content: t }]);
      speak(t);
    }, 100);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && inputVal.trim() && !loading) handleUserInput(inputVal);
  };

  const m = (n) => money(n, currency);
  const showChips = messages.length <= 2 && step === 0 && !loading;

  return (
    <div className="pv">
      <div className="pv-console">
        <div className="pv-header">
          <div className="live" style={{ justifyContent: 'center' }}>Trailmind AI Planner</div>
          <p className="pv-sub">Answer a few questions. Get a full costed itinerary.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 }}>
            <div className="pv-progress">
              {STEPS.map((s, i) => (
                <div key={i} className={'pv-dot' + (s.key in answers ? ' done' : i === step && step < STEPS.length ? ' current' : '')} />
              ))}
            </div>
            {messages.length > 0 && (
              <button className="pv-new-chat" onClick={newChat} title="Start over">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New chat
              </button>
            )}
          </div>
        </div>

        <div className="pv-chat">
          {messages.map((msg, i) => (
            <div key={i} className={'pv-msg pv-msg-' + msg.role}>
              <div className="pv-msg-bubble">{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="pv-msg pv-msg-assistant">
              <div className="pv-msg-bubble pv-typing"><span></span><span></span><span></span></div>
            </div>
          )}

          {transcript && (
            <div className="pv-msg pv-msg-user">
              <div className="pv-msg-bubble pv-msg-interim">{transcript}</div>
            </div>
          )}

          {showChips && (
            <div className="pv-suggestions">
              <button onClick={() => processRichInput('A week in Japan, mid-range')}>Week in Japan</button>
              <button onClick={() => processRichInput('5 days in Dubai, luxury')}>Dubai luxury</button>
              <button onClick={() => processRichInput('10 days in Peru, budget')}>Peru backpacking</button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {plan && (
          <div className="pv-plan">
            <div className="pv-plan-header">
              <div>
                <h3>{plan.duration}-day {plan.city} adventure</h3>
                <div className="pv-plan-meta">{plan.tier} | {plan.travellers} traveller{plan.travellers > 1 ? 's' : ''} | {plan.country}</div>
              </div>
              <div className="pv-plan-score">
                <svg viewBox="0 0 120 120" style={{ width: 80, height: 80 }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#333" strokeWidth="8" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#F59E0B" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 * (1 - plan.score / 100)}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }} />
                  <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="900" fill="#fff">{plan.score}%</text>
                  <text x="60" y="72" textAnchor="middle" fontSize="9" fontWeight="700" fill="#aaa">MATCH</text>
                </svg>
              </div>
            </div>

            {plan.itinerary && plan.itinerary.map((day) => (
              <div className="pv-day" key={day.day}>
                <div className="pv-day-header">
                  <span className="pv-day-num">Day {day.day}</span>
                  <span className="pv-day-theme">{day.theme}</span>
                </div>
                {day.activities && day.activities.map((act, ai) => (
                  <div className="pv-act" key={ai}>
                    <div className="pv-act-time">{act.time}</div>
                    <div className="pv-act-body">
                      <div className="pv-act-name">{act.name}</div>
                      <div className="pv-act-desc">{act.type} | {act.duration}</div>
                    </div>
                    <div className="pv-act-cost">{act.cost === 0 ? 'Free' : '~' + m(act.cost)}</div>
                  </div>
                ))}
              </div>
            ))}

            {plan.breakdown && (
              <div className="pv-breakdown">
                <h4>Cost estimate (per person)</h4>
                <div className="pv-brk-row"><span>Activities</span><b>~{m(plan.breakdown.activities)}</b></div>
                <div className="pv-brk-row"><span>Accommodation ({plan.nights} nights)</span><b>~{m(plan.breakdown.accommodation)}</b></div>
                <div className="pv-brk-row"><span>Food</span><b>~{m(plan.breakdown.food)}</b></div>
                <div className="pv-brk-row"><span>Transport</span><b>~{m(plan.breakdown.transport)}</b></div>
                <div className="pv-brk-row"><span>Buffer (10%)</span><b>~{m(plan.breakdown.buffer)}</b></div>
                <div className="pv-brk-total"><span>Total per person</span><span>~{m(plan.breakdown.total)}</span></div>
                {plan.travellers > 1 && (
                  <div className="pv-brk-row" style={{ marginTop: 8 }}>
                    <span>x{plan.travellers} travellers</span>
                    <b style={{ color: 'var(--color-coral)' }}>~{m(plan.breakdown.total * plan.travellers)}</b>
                  </div>
                )}
              </div>
            )}

            {plan.accommodation && plan.accommodation.length > 0 && (
              <div className="pv-stays">
                <h4>Where to stay</h4>
                {plan.accommodation.map((h, i) => (
                  <div className={'pv-stay' + (i === 0 ? ' recommended' : '')} key={i}>
                    <div>
                      <div className="pv-stay-name">{h.name} {i === 0 && <span className="pv-stay-tag">Recommended</span>}</div>
                      <div className="pv-stay-type">{h.type}</div>
                    </div>
                    <div className="pv-stay-price">~{m(h.pricePerNight)}<span>/night</span></div>
                  </div>
                ))}
              </div>
            )}

            <div className="pv-plan-actions">
              <button className="btn btn-coral" onClick={() => toast('Trip saved!')}>Save this trip</button>
              <button className="btn btn-ghost" style={{ border: '1px solid rgba(255,255,255,0.2)' }} onClick={newChat}>Plan another trip</button>
            </div>
          </div>
        )}

        <div className="pv-input-bar">
          <div className="pv-input-wrap">
            <input
              className="pv-input"
              placeholder={listening ? 'Listening... click mic or wait to finish' : step < STEPS.length ? STEPS[step].ask : 'Your plan is ready!'}
              value={listening ? transcript : inputVal}
              onChange={e => { if (!listening) setInputVal(e.target.value); }}
              onKeyDown={handleKey}
              disabled={loading}
              readOnly={listening}
            />
            <button
              className={'pv-mic-btn' + (listening ? ' active' : '')}
              onClick={toggleMic}
              title={listening ? 'Click to stop recording' : 'Click to start voice input'}
              disabled={loading}
            >
              {listening ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
          </div>
          <button
            className="pv-send-btn"
            onClick={() => { if (listening) stopRecording(); else handleUserInput(inputVal); }}
            disabled={loading || (!inputVal.trim() && !listening)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
