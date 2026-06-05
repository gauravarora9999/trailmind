import { useState, useRef, useEffect } from 'react';
import { money } from '../data.js';

export default function VoicePage({ openPlanner, showExplore, toast, currency = 'USD', initialMessage = '' }) {
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

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Set up speech recognition
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
          setTranscript('');
          sendMessage(text);
          try { recog.stop(); } catch (_) {}
        }
      };
      recog.onend = () => setListening(false);
      recognRef.current = recog;
    }
    synthRef.current = window.speechSynthesis || null;
  }, []);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && !sentInit.current) {
      sentInit.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  const speak = (text) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.05;
      synthRef.current.speak(utt);
    }
  };

  const toggleMic = () => {
    if (listening) {
      if (recognRef.current) try { recognRef.current.stop(); } catch (_) {}
      setListening(false);
      return;
    }
    if (recognRef.current) {
      setListening(true);
      setTranscript('');
      try { recognRef.current.start(); } catch (_) {}
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputVal('');
    setListening(false);
    setLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, currency }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get response');
      }

      const data = await resp.json();
      const assistantMsg = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMsg]);
      speak(data.message);

      if (data.plan) {
        setPlan(data.plan);
      }
    } catch (err) {
      toast('Error: ' + err.message);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && inputVal.trim() && !loading) {
      sendMessage(inputVal);
    }
  };

  const m = (n) => money(n, currency);

  return (
    <div className="pv">
      <div className="pv-console">
        <div className="pv-header">
          <div className="live" style={{ justifyContent: 'center' }}>Trailmind AI Planner</div>
          <p className="pv-sub">Tell me about your dream trip and I'll build a detailed, costed itinerary.</p>
        </div>

        {/* Chat messages */}
        <div className="pv-chat">
          {messages.length === 0 && !loading && (
            <div className="pv-empty">
              <div className="pv-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
              <p>Type or speak your travel idea</p>
              <div className="pv-suggestions">
                <button onClick={() => sendMessage('I want a week in Japan, mid-range budget, love food and culture')}>Japan food & culture trip</button>
                <button onClick={() => sendMessage('Adventure trip to Patagonia for 10 days, budget around $2500')}>Patagonia adventure</button>
                <button onClick={() => sendMessage('Romantic 5 days in Italy, luxury, just the two of us')}>Romantic Italy getaway</button>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={'pv-msg pv-msg-' + msg.role}>
              <div className="pv-msg-bubble">
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="pv-msg pv-msg-assistant">
              <div className="pv-msg-bubble pv-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          {transcript && (
            <div className="pv-msg pv-msg-user">
              <div className="pv-msg-bubble pv-msg-interim">{transcript}</div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Plan result */}
        {plan && (
          <div className="pv-plan">
            <div className="pv-plan-header">
              <h3>{plan.duration}-day {plan.city} adventure</h3>
              <div className="pv-plan-meta">{plan.tier} | {plan.travellers} traveller{plan.travellers > 1 ? 's' : ''} | {plan.country}</div>
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

            {/* Day-by-day */}
            {plan.itinerary.map((day) => (
              <div className="pv-day" key={day.day}>
                <div className="pv-day-header">
                  <span className="pv-day-num">Day {day.day}</span>
                  <span className="pv-day-theme">{day.theme}</span>
                </div>
                {day.activities.map((act, ai) => (
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

            {/* Cost breakdown */}
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

            {/* Accommodation options */}
            {plan.accommodation && (
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
              <button className="btn btn-ghost" style={{ border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => { setPlan(null); sendMessage('Can you adjust the plan? I\'d like some changes.'); }}>Adjust plan</button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="pv-input-bar">
          <div className="pv-input-wrap">
            <input
              className="pv-input"
              placeholder={listening ? 'Listening...' : 'Describe your dream trip...'}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button
              className={'pv-mic-btn' + (listening ? ' active' : '')}
              onClick={toggleMic}
              title={listening ? 'Stop listening' : 'Speak'}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          </div>
          <button
            className="pv-send-btn"
            onClick={() => sendMessage(inputVal)}
            disabled={!inputVal.trim() || loading}
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
