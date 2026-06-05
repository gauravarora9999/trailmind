import { useState, useRef, useEffect, useCallback } from 'react';
import { money } from '../data.js';

const SILENCE_TIMEOUT = 8000;

function sanitizeInput(text) {
  // Strip anything that looks like JSON objects from user input
  let clean = text.replace(/\{[\s\S]*?\}/g, '').trim();
  // Strip markdown code fences
  clean = clean.replace(/```[\s\S]*?```/g, '').trim();
  // If sanitization removed everything, return a generic message
  return clean || 'Tell me about a travel destination.';
}

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
  const silenceTimer = useRef(null);
  const finalTranscript = useRef('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const stopRecording = useCallback(() => {
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
    if (recognRef.current) try { recognRef.current.stop(); } catch (_) {}
    setListening(false);

    const text = finalTranscript.current.trim();
    finalTranscript.current = '';
    if (text) {
      setTranscript('');
      sendMessage(text);
    }
  }, []);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(() => {
      stopRecording();
    }, SILENCE_TIMEOUT);
  }, [stopRecording]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recog = new SR();
      recog.lang = 'en-US';
      recog.continuous = true;
      recog.interimResults = true;

      recog.onresult = (e) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            final += t + ' ';
          } else {
            interim += t;
          }
        }
        if (final) {
          finalTranscript.current = final.trim();
        }
        setTranscript((final + interim).trim());
        resetSilenceTimer();
      };

      recog.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          toast('Mic error: ' + e.error);
        }
        setListening(false);
        if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
      };

      recog.onend = () => {
        setListening(prev => {
          if (prev) {
            const text = finalTranscript.current.trim();
            finalTranscript.current = '';
            if (text) {
              setTranscript('');
              sendMessage(text);
            }
          }
          return false;
        });
        if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
      };

      recognRef.current = recog;
    }
    synthRef.current = window.speechSynthesis || null;
  }, []);

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
      stopRecording();
      return;
    }
    if (!recognRef.current) {
      toast('Speech recognition not supported in this browser');
      return;
    }
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
    if (listening) {
      if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
      if (recognRef.current) try { recognRef.current.stop(); } catch (_) {}
      setListening(false);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    // Sanitize user input — strip JSON and code fences
    const clean = sanitizeInput(text);

    const userMsg = { role: 'user', content: clean };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputVal('');
    setListening(false);
    setLoading(true);

    try {
      // Only send last 8 messages to keep within timeout
      const toSend = newMessages.slice(-8);

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toSend, currency }),
      });

      let data;
      try {
        data = await resp.json();
      } catch {
        data = { message: 'Sorry, I had trouble understanding that. Could you rephrase?', plan: null };
      }

      // Extract clean message text — never show raw JSON to user
      let msgText = data.message || '';
      if (msgText.startsWith('{') || msgText.startsWith('[')) {
        try {
          const parsed = JSON.parse(msgText);
          msgText = parsed.message || 'I can help you plan a trip. Where would you like to go?';
        } catch {
          msgText = 'I can help you plan a trip. Where would you like to go?';
        }
      }
      // Strip any remaining JSON fragments
      msgText = msgText.replace(/\{[\s\S]*?\}/g, '').replace(/```[\s\S]*?```/g, '').trim();
      if (!msgText) msgText = 'I can help you plan a trip. Where would you like to go?';

      const assistantMsg = { role: 'assistant', content: msgText };
      setMessages(prev => [...prev, assistantMsg]);
      speak(msgText);

      if (data.plan && typeof data.plan === 'object' && data.plan.city) {
        setPlan(data.plan);
      }
    } catch (err) {
      const errMsg = 'Connection failed. Please try again.';
      toast(errMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
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
          {messages.length > 0 && (
            <button className="pv-new-chat" onClick={newChat} title="Start a new conversation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New chat
            </button>
          )}
        </div>

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
                <button onClick={() => sendMessage('I want a week in Japan, mid-range budget, love food and culture')}>Japan food & culture</button>
                <button onClick={() => sendMessage('Adventure trip to Patagonia for 10 days, budget around $2500')}>Patagonia adventure</button>
                <button onClick={() => sendMessage('Romantic 5 days in Italy, luxury, just the two of us')}>Romantic Italy</button>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={'pv-msg pv-msg-' + msg.role}>
              <div className="pv-msg-bubble">{msg.content}</div>
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
              <button className="btn btn-ghost" style={{ border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => { setPlan(null); sendMessage('Can you adjust the plan? I would like some changes.'); }}>Adjust plan</button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="pv-input-bar">
          <div className="pv-input-wrap">
            <input
              className="pv-input"
              placeholder={listening ? 'Listening... click mic or wait to finish' : 'Describe your dream trip...'}
              value={listening ? transcript : inputVal}
              onChange={e => { if (!listening) setInputVal(e.target.value); }}
              onKeyDown={handleKey}
              disabled={loading}
              readOnly={listening}
            />
            <button
              className={'pv-mic-btn' + (listening ? ' active' : '')}
              onClick={toggleMic}
              title={listening ? 'Click to stop recording' : 'Click to start recording (stops after 8s of silence)'}
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
            onClick={() => { if (listening) stopRecording(); else sendMessage(inputVal); }}
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
