import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';

const GREETING = {
  role: 'assistant',
  content: "Hey there! I'm your Trailmind Adventure Sport AI — think of me as your personal expedition planner, risk assessor, and adventure coach all in one. I'll help you design a safe, thrilling, and totally personalised adventure plan. Ready to get started? What's your name?",
  action: null,
};

function ProfileCard({ profile, onConfirm, onEdit }) {
  const fields = [
    ['Name', profile.name],
    ['Age', profile.age],
    ['Home City', profile.home_city],
    ['Adventure Sport', profile.adventure_sport],
    ['Planned Location', profile.planned_location],
    ['Fitness Level', profile.fitness_level],
    ['Certifications', profile.certifications],
    ['Driving / Riding License', profile.driving_license],
    ['License Issued In', profile.license_issued_in],
    ['Preferred Currency', profile.preferred_currency],
    ['Budget', profile.budget ? `${profile.preferred_currency || ''} ${profile.budget}`.trim() : '—'],
    ['Available Days', profile.available_days],
    ['Risk Tolerance', profile.risk_tolerance],
  ];
  return (
    <div className="adv-card profile-card">
      <div className="adv-card-header">🧗 YOUR TRAILMIND PROFILE</div>
      <div className="adv-card-body">
        {fields.map(([label, value]) => (
          <div className="adv-card-row" key={label}>
            <span className="adv-card-label">{label}</span>
            <span className="adv-card-value">{value || '—'}</span>
          </div>
        ))}
      </div>
      <div className="adv-card-actions">
        <button className="btn btn-coral" onClick={onConfirm}>✓ Looks correct</button>
        <button className="btn btn-ghost" onClick={onEdit}>✎ Edit a field</button>
      </div>
    </div>
  );
}

function FinalCard({ profile, onConfirm }) {
  const fields = [
    ['Name', profile.name],
    ['Age', profile.age],
    ['Home City', profile.home_city],
    ['Adventure Sport', profile.adventure_sport],
    ['Planned Location', profile.planned_location],
    ['Fitness Level', profile.fitness_level],
    ['Certifications', profile.certifications],
    ['Driving / Riding License', profile.driving_license],
    ['License Issued In', profile.license_issued_in],
    ['Preferred Currency', profile.preferred_currency],
    ['Budget', profile.budget ? `${profile.preferred_currency || ''} ${profile.budget}`.trim() : '—'],
    ['Available Days', profile.available_days],
    ['Risk Tolerance', profile.risk_tolerance],
  ];
  return (
    <div className="adv-card final-card">
      <div className="adv-card-header">✅ FINAL ADVENTURE BRIEF — TRAILMIND</div>
      <div className="adv-card-body">
        {fields.map(([label, value]) => (
          <div className="adv-card-row" key={label}>
            <span className="adv-card-label">{label}</span>
            <span className="adv-card-value">{value || '—'}</span>
          </div>
        ))}
      </div>
      <div className="adv-card-actions">
        <button className="btn btn-coral" style={{ width: '100%' }} onClick={onConfirm}>
          🔒 YES, LOCK IT IN
        </button>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max = 10, color = '#e05a2b' }) {
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-label">{label}</div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <div className="score-bar-val">{value}/{max}</div>
    </div>
  );
}

function PlanCard({ plan }) {
  const [tab, setTab] = useState('overview');
  const tabs = ['overview', 'budget', 'gear', 'docs', 'insurance', 'training', 'risk', 'roadmap'];
  const tabLabels = { overview: 'Overview', budget: 'Budget', gear: 'Gear', docs: 'Docs', insurance: 'Insurance', training: 'Training', risk: 'Risk', roadmap: 'Roadmap' };
  const adv = plan.recommended_adventure || {};
  const bud = plan.budget || {};
  const gear = plan.gear || {};
  const ins = plan.insurance || {};
  const risk = plan.risk_analysis || {};
  const alt = plan.alternative_adventure || {};

  return (
    <div className="adv-card plan-card">
      <div className="adv-card-header">🏔 YOUR ADVENTURE PLAN</div>

      <div className="plan-meta-strip">
        <div className="plan-meta-item">
          <span className="plan-meta-label">Persona</span>
          <span className="plan-meta-val">{plan.persona}</span>
        </div>
        <div className="plan-meta-item">
          <span className="plan-meta-label">Readiness</span>
          <span className="plan-meta-val">{plan.readiness_index}%</span>
        </div>
        <div className="plan-meta-item">
          <span className="plan-meta-label">Risk Tier</span>
          <span className="plan-meta-val">{plan.risk_tier}</span>
        </div>
        <div className="plan-meta-item">
          <span className="plan-meta-label">Level</span>
          <span className="plan-meta-val">{plan.adventure_tier}</span>
        </div>
      </div>

      <div className="plan-tabs">
        {tabs.map(t => (
          <button key={t} className={`plan-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      <div className="plan-tab-body">
        {tab === 'overview' && (
          <div>
            <div className="plan-section-title">{adv.name}</div>
            <div className="plan-why">{adv.why_it_fits}</div>
            <div className="plan-detail-row"><span>📍 Location</span><span>{adv.location}</span></div>
            <div className="plan-detail-row"><span>📅 Duration</span><span>{adv.duration_days} days</span></div>
            <div className="plan-scores">
              <ScoreBar label="Story Value" value={adv.story_value_score} color="#e05a2b" />
              <ScoreBar label="Physical Challenge" value={adv.physical_challenge} color="#c0392b" />
              <ScoreBar label="Mental Challenge" value={adv.mental_challenge} color="#8e44ad" />
              <ScoreBar label="Technical Difficulty" value={adv.technical_difficulty} color="#2980b9" />
              <ScoreBar label="Risk Score" value={adv.risk_score} color="#e67e22" />
            </div>
            {alt.name && (
              <div className="plan-alt">
                <div className="plan-alt-title">Alternative: {alt.name}</div>
                <div className="plan-alt-loc">{alt.location}</div>
                <div className="plan-alt-why">{alt.why}</div>
                {alt.budget_saving > 0 && <div className="plan-alt-save">Saves ~{bud.currency} {alt.budget_saving}</div>}
              </div>
            )}
          </div>
        )}

        {tab === 'budget' && (
          <div>
            <div className="plan-budget-total">Total: {bud.currency} {bud.total?.toLocaleString()}</div>
            {[
              ['✈ Transportation', bud.transportation],
              ['🏨 Accommodation', bud.accommodation],
              ['🍽 Food', bud.food],
              ['🎒 Gear', bud.gear],
              ['📋 Permits', bud.permits],
              ['🧭 Guides', bud.guides],
              ['🛡 Insurance', bud.insurance],
              ['🆘 Emergency Buffer', bud.emergency_buffer],
            ].map(([label, val]) => (
              <div className="plan-budget-row" key={label}>
                <span>{label}</span>
                <span>{bud.currency} {val?.toLocaleString() || '—'}</span>
                {bud.total > 0 && <div className="plan-budget-bar" style={{ width: `${Math.round((val / bud.total) * 100)}%` }} />}
              </div>
            ))}
            <div className="plan-travel-plan">
              <div className="plan-section-title" style={{ marginTop: 16 }}>✈ Travel Plan</div>
              <p>{plan.travel_plan}</p>
            </div>
          </div>
        )}

        {tab === 'gear' && (
          <div>
            {gear.mandatory?.length > 0 && (
              <>
                <div className="plan-gear-group">🔴 Mandatory</div>
                {gear.mandatory.map(g => <div className="plan-gear-item" key={g}>• {g}</div>)}
              </>
            )}
            {gear.recommended?.length > 0 && (
              <>
                <div className="plan-gear-group">🟡 Recommended</div>
                {gear.recommended.map(g => <div className="plan-gear-item" key={g}>• {g}</div>)}
              </>
            )}
            {gear.optional?.length > 0 && (
              <>
                <div className="plan-gear-group">🟢 Optional</div>
                {gear.optional.map(g => <div className="plan-gear-item" key={g}>• {g}</div>)}
              </>
            )}
            <div className="plan-gear-costs">
              <div>Buy estimate: <strong>{bud.currency} {gear.estimated_buy_cost?.toLocaleString()}</strong></div>
              <div>Rental estimate: <strong>{bud.currency} {gear.estimated_rental_cost?.toLocaleString()}</strong></div>
            </div>
          </div>
        )}

        {tab === 'docs' && (
          <div>
            <div className="plan-section-title">Required Documentation</div>
            {(plan.documentation || []).map(d => (
              <div className="plan-doc-item" key={d}>📄 {d}</div>
            ))}
          </div>
        )}

        {tab === 'insurance' && (
          <div>
            <div className="plan-section-title">Insurance Requirements</div>
            <div className="plan-ins-type">{ins.type_required}</div>
            <div className="plan-detail-row"><span>Estimated Premium</span><span>{bud.currency} {ins.estimated_premium?.toLocaleString()}</span></div>
            <div className="plan-detail-row"><span>Min Coverage</span><span>USD {ins.min_coverage_usd?.toLocaleString()}</span></div>
            <div className="plan-ins-covers">
              {[['Rescue', ins.rescue_coverage], ['Evacuation', ins.evacuation_coverage], ['Repatriation', ins.repatriation_coverage], ['Gear Protection', ins.gear_protection], ['Trip Cancellation', ins.trip_cancellation]].map(([label, val]) => (
                <div key={label} className={`plan-ins-tag ${val ? 'covered' : 'not-covered'}`}>
                  {val ? '✓' : '✗'} {label}
                </div>
              ))}
            </div>
            {ins.exclusions_to_watch?.length > 0 && (
              <>
                <div className="plan-section-title" style={{ marginTop: 12 }}>⚠ Watch Out For</div>
                {ins.exclusions_to_watch.map(e => <div className="plan-gear-item" key={e}>• {e}</div>)}
              </>
            )}
          </div>
        )}

        {tab === 'training' && (
          <div>
            <div className="plan-section-title">Training Plan</div>
            <p style={{ lineHeight: 1.7 }}>{plan.training_plan}</p>
          </div>
        )}

        {tab === 'risk' && (
          <div>
            <div className="plan-section-title">Risk Analysis</div>
            {[['⚡ Physical', risk.physical], ['🔧 Technical', risk.technical], ['🌿 Environmental', risk.environmental], ['💰 Financial', risk.financial]].map(([label, val]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{val}</div>
              </div>
            ))}
            <div className="plan-detail-row" style={{ marginTop: 12 }}>
              <span>Rescue Complexity</span><span>{risk.rescue_complexity}</span>
            </div>
          </div>
        )}

        {tab === 'roadmap' && (
          <div>
            <div className="plan-section-title">1-Year Plan</div>
            <p style={{ lineHeight: 1.7, fontSize: 13 }}>{plan.one_year_plan}</p>
            <div className="plan-section-title" style={{ marginTop: 14 }}>5-Year Roadmap</div>
            <p style={{ lineHeight: 1.7, fontSize: 13 }}>{plan.five_year_roadmap}</p>
            {plan.lifetime_bucket_list?.length > 0 && (
              <>
                <div className="plan-section-title" style={{ marginTop: 14 }}>🪣 Lifetime Bucket List</div>
                {plan.lifetime_bucket_list.map((item, i) => (
                  <div className="plan-bucket-item" key={i}>#{i + 1} {item}</div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdventurePage({ toast, user }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING.content, action: null, profile: null, plan: null },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profileConfirmed, setProfileConfirmed] = useState(false);

  const bottomRef = useRef(null);
  const recognRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text) => {
    if (!voiceOn || !synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 1.05;
    synthRef.current.speak(utt);
  }, [voiceOn]);

  const saveToSupabase = useCallback(async (profile) => {
    try {
      const now = new Date();
      await supabase.from('adventure_profiles').insert({
        session_id: `session_${Date.now()}`,
        plan_number: 1,
        created_at_utc: now.toISOString(),
        caller_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        name: profile.name,
        age: profile.age ? parseInt(profile.age) : null,
        home_city: profile.home_city,
        adventure_sport: profile.adventure_sport,
        planned_location: profile.planned_location,
        fitness_level: profile.fitness_level,
        certifications: profile.certifications,
        driving_license_type: profile.driving_license,
        license_issued_in: profile.license_issued_in,
        preferred_currency: profile.preferred_currency,
        budget: profile.budget ? parseFloat(profile.budget) : null,
        available_days: profile.available_days ? parseInt(profile.available_days) : null,
        risk_tolerance: profile.risk_tolerance,
        status: 'complete',
        user_id: user?.id || null,
      });
    } catch (e) {
      console.error('Supabase save failed:', e);
    }
  }, [user]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch('/api/adventure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await resp.json();
      const aiMsg = {
        role: 'assistant',
        content: data.message || 'Something went wrong. Please try again.',
        action: data.action || null,
        profile: data.profile || null,
        plan: data.plan || null,
      };

      if (data.profile) setCurrentProfile(data.profile);

      setMessages(prev => [...prev, aiMsg]);
      speak(data.message || '');

      if (data.action === 'show_plan' && data.profile) {
        saveToSupabase(data.profile);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        action: null, profile: null, plan: null,
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, speak, saveToSupabase]);

  const handleConfirmProfile = useCallback(() => {
    sendMessage("Yes, everything looks correct!");
  }, [sendMessage]);

  const handleEditProfile = useCallback(() => {
    sendMessage("I'd like to edit a field.");
  }, [sendMessage]);

  const handleFinalConfirm = useCallback(async () => {
    if (!currentProfile || loading) return;
    setProfileConfirmed(true);

    const userMsg = { role: 'user', content: 'Yes, lock it in!', action: null, profile: null, plan: null };
    const fillerMsg = {
      role: 'assistant',
      content: "Brilliant! Hang tight while I build your personalised adventure plan — this is the good stuff! Did you know Edmund Hillary once said: \"It is not the mountain we conquer, but ourselves\"? That's the spirit we're building your plan around!",
      action: null, profile: null, plan: null,
    };
    setMessages(prev => [...prev, userMsg, fillerMsg]);
    setLoading(true);

    try {
      const resp = await fetch('/api/adventure-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: currentProfile }),
      });

      const data = await resp.json();

      if (data.error || !data.plan) {
        throw new Error(data.error || 'No plan returned');
      }

      const planMsg = {
        role: 'assistant',
        content: 'Your adventure plan is ready! Here\'s everything you need to make it happen.',
        action: 'show_plan',
        profile: currentProfile,
        plan: data.plan,
      };

      setMessages(prev => [...prev, planMsg]);
      speak(planMsg.content);
      saveToSupabase(currentProfile);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong generating your plan. Please try again.',
        action: null, profile: null, plan: null,
      }]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile, loading, speak, saveToSupabase]);

  const toggleVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Voice input not supported in this browser'); return; }

    if (listening) {
      recognRef.current?.stop();
      setListening(false);
      return;
    }

    const recog = new SR();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      sendMessage(text);
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    recog.start();
    recognRef.current = recog;
    setListening(true);
  }, [listening, sendMessage, toast]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="adv-page">
      <div className="adv-hero">
        <div className="wrap">
          <div className="adv-hero-badge">Adventure Sport AI</div>
          <h1 className="adv-hero-title">Your Personal Adventure Consultant</h1>
          <p className="adv-hero-sub">
            Elite adventure planning — powered by AI. Get a personalised plan with risk assessment, gear list, insurance guide, and a 5-year adventure roadmap.
          </p>
        </div>
      </div>

      <div className="wrap adv-wrap">
        <div className="adv-chat-panel">
          <div className="adv-chat-header">
            <div className="adv-chat-title">
              <span className="adv-status-dot" />
              Trailmind Adventure AI
            </div>
            <div className="adv-chat-controls">
              <button
                className={`adv-voice-toggle ${voiceOn ? 'active' : ''}`}
                onClick={() => setVoiceOn(v => !v)}
                title={voiceOn ? 'Voice output on' : 'Voice output off'}
              >
                🔊 {voiceOn ? 'Voice On' : 'Voice Off'}
              </button>
            </div>
          </div>

          <div className="adv-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`adv-msg-wrap ${msg.role}`}>
                {msg.role === 'assistant' && <div className="adv-avatar">🏔</div>}
                <div className={`adv-bubble ${msg.role}`}>
                  <div className="adv-bubble-text">{msg.content}</div>
                  {msg.action === 'show_profile_card' && msg.profile && (
                    <ProfileCard
                      profile={msg.profile}
                      onConfirm={handleConfirmProfile}
                      onEdit={handleEditProfile}
                    />
                  )}
                  {msg.action === 'show_final_card' && msg.profile && (
                    <FinalCard profile={msg.profile} onConfirm={handleFinalConfirm} />
                  )}
                  {msg.action === 'show_plan' && msg.plan && (
                    <PlanCard plan={msg.plan} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="adv-msg-wrap assistant">
                <div className="adv-avatar">🏔</div>
                <div className="adv-bubble assistant">
                  <div className="adv-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="adv-input-row">
            <button
              className={`adv-mic-btn ${listening ? 'active' : ''}`}
              onClick={toggleVoice}
              title={listening ? 'Stop listening' : 'Speak your answer'}
            >
              {listening ? '🔴' : '🎙'}
            </button>
            <input
              ref={inputRef}
              className="adv-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={listening ? 'Listening…' : 'Type your answer…'}
              disabled={loading || listening}
            />
            <button
              className="btn btn-coral adv-send-btn"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
