import { useState, useRef, useEffect } from 'react';
import { VQ, CITIES, pickRegionFrom, mapBudgetTier, PL_STAGES, validateVoiceAnswer } from '../data.js';

export default function VoicePage({ openPlanner, showExplore, toast }) {
  const [vIdx, setVIdx] = useState(0);
  const [vAns, setVAns] = useState({});
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [done, setDone] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStage, setGenStage] = useState(0);
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

    // Speak first question
    if (synthRef.current) {
      const utt = new SpeechSynthesisUtterance(VQ[0].q);
      utt.rate = 1.05;
      synthRef.current.speak(utt);
    }
  }, []);

  const speak = (text) => {
    if (synthRef.current) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.05;
      synthRef.current.speak(utt);
    }
  };

  const orbTap = () => {
    if (done) return;
    if (recognRef.current && !listening) {
      setListening(true);
      setTranscript('');
      try { recognRef.current.start(); } catch (_) {}
    }
  };

  const answer = (text) => {
    if (done) return;

    // Validate the answer is relevant to the question
    if (!validateVoiceAnswer(vIdx, text)) {
      toast('That doesn\'t seem to match the question. Try again or pick an option.');
      setTranscript('');
      setListening(false);
      if (recognRef.current) try { recognRef.current.stop(); } catch (_) {}
      return;
    }

    setVAns(prev => ({ ...prev, [vIdx]: text }));
    setTranscript('');
    setInputVal('');
    setListening(false);
    if (recognRef.current) try { recognRef.current.stop(); } catch (_) {}

    const next = vIdx + 1;
    if (next < VQ.length) {
      setVIdx(next);
      speak(VQ[next].q);
    } else {
      setDone(true);
      speak('Great choices! Generating your plan now.');
    }
  };

  const handleInputKey = (e) => {
    if (e.key === 'Enter' && inputVal.trim()) answer(inputVal.trim());
  };

  const generatePlan = () => {
    const trip = vAns[0] || '';
    const region = pickRegionFrom(trip);
    const tier = mapBudgetTier(vAns[2] || '');
    const city = region
      ? CITIES.find(c => c.region === region) || CITIES[0]
      : CITIES[0];

    setGenerating(true);
    setGenStage(0);
    let s = 0;
    const iv = setInterval(() => {
      s++;
      setGenStage(s);
      if (s >= PL_STAGES.length) {
        clearInterval(iv);
        openPlanner(city.name, city.acts.map(a => a.t), tier);
      }
    }, 700);
  };

  return (
    <div className="pv">
      <div className="pv-console">
        <div className="live" style={{ justifyContent: 'center', marginBottom: '24px' }}>Voice Planner</div>

        <div className={`pv-orb${listening ? ' listening' : ''}`} onClick={orbTap}>
          <div className="ring" />
        </div>

        <div className={`waves${listening ? ' on' : ''}`} style={{ marginBottom: '20px' }}>
          <span /><span /><span /><span /><span />
        </div>

        {!done && (
          <>
            <div className="pv-status">{listening ? 'Listening...' : 'Tap the orb to speak, or use the options below'}</div>
            <div className="pv-q">{VQ[vIdx].q}</div>
            {transcript && <div className="pv-transcript">{transcript}</div>}

            <div className="pv-chips">
              {VQ[vIdx].chips.map(c => (
                <button key={c} className="pv-chip" onClick={() => answer(c)}>{c}</button>
              ))}
            </div>

            <div className="pv-dots">
              {VQ.map((_, i) => <i key={i} className={i <= vIdx ? 'active' : ''} />)}
            </div>

            <div className="pv-input-wrap">
              <input
                className="pv-input"
                placeholder="Type your answer..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleInputKey}
              />
              <button
                className={'pv-mic-btn' + (listening ? ' active' : '')}
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

        {done && !generating && (
          <>
            <div className="pv-q">Your travel profile</div>
            <div className="pv-steps">
              {Object.entries(vAns).map(([k, v]) => (
                <div className="pv-step done" key={k}>
                  <div className="num">{Number(k) + 1}</div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.5 }}>{VQ[k]?.q}</div>
                    <div style={{ fontWeight: 700 }}>{v}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="btn btn-coral"
              style={{ marginTop: '32px', width: '100%', justifyContent: 'center' }}
              onClick={generatePlan}
            >
              Generate my itinerary
            </button>
          </>
        )}

        {generating && (
          <div className="pl-gen" style={{ color: '#fff' }}>
            <div className="spinner" />
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
              {PL_STAGES[genStage] || 'Finishing...'}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.5 }}>Stage {genStage + 1} of {PL_STAGES.length}</div>
          </div>
        )}
      </div>
    </div>
  );
}
