import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';

const GREETING = {
  role: 'assistant',
  content: "Hey! I'm your Trailmind Adventure AI — expedition planner, risk assessor, and adventure coach in one. Tell me about yourself and what adventure you're dreaming of — the more you share at once, the faster we get to your plan!",
  action: null,
};

const TOTAL_FIELDS = 13;

const PERSONA_EMOJIS = {
  Explorer: '🗺', Warrior: '⚔️', Mountaineer: '🏔', Nomad: '🌍', Survivor: '💪'
};

// ── Profile Card ──
function ProfileCard({ profile, onConfirm, onEdit }) {
  const fields = [
    ['Name', profile.name], ['Age', profile.age], ['Home City', profile.home_city],
    ['Adventure Sport', profile.adventure_sport], ['Planned Location', profile.planned_location],
    ['Fitness Level', profile.fitness_level], ['Certifications', profile.certifications],
    ['Currency', profile.preferred_currency],
    ['Budget', profile.budget ? `${profile.preferred_currency} ${profile.budget}` : '—'],
    ['Available Days', profile.available_days], ['Risk Tolerance', profile.risk_tolerance],
    ['Travel Month', profile.travel_month || '—'], ['Companions', profile.travel_companions || 'Solo'],
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
        <button className="btn btn-ghost" onClick={onEdit}>✎ Edit</button>
      </div>
    </div>
  );
}

// ── Persona Reveal ──
function PersonaReveal({ data, onContinue }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setTimeout(() => setRevealed(true), 300); }, []);
  return (
    <div className={`persona-reveal${revealed ? ' revealed' : ''}`}>
      <div className="pr-emoji">{PERSONA_EMOJIS[data.persona] || '🏔'}</div>
      <div className="pr-label">Your adventure persona</div>
      <div className="pr-name">{data.persona}</div>
      <div className="pr-tagline">"{data.tagline}"</div>
      <div className="pr-dims">
        {(data.dimensions || []).map((d, i) => (
          <div key={d.name} className="pr-dim">
            <div className="pr-dim-label">{d.name}</div>
            <div className="pr-dim-track">
              <div
                className="pr-dim-fill"
                style={{ width: revealed ? `${d.score * 10}%` : '0%', transitionDelay: `${0.3 + i * 0.1}s` }}
              />
            </div>
            <div className="pr-dim-score">{d.score}/10</div>
          </div>
        ))}
      </div>
      <button className="btn btn-coral" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={onContinue}>
        🔒 Yes, lock it in — build my plan!
      </button>
    </div>
  );
}

// ── Plan Card ──
function ScoreBar({ label, value, max = 10, color = '#e05a2b' }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW((value / max) * 100), 200); }, [value, max]);
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-label">{label}</div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${w}%`, background: color, transition: 'width 0.8s ease' }} />
      </div>
      <div className="score-bar-val">{value}/{max}</div>
    </div>
  );
}

function PlanCard({ plan, onShare, planCardRef }) {
  const [tab, setTab] = useState('overview');
  const [visibleTabs, setVisibleTabs] = useState(['overview']);
  const tabs = ['overview', 'budget', 'gear', 'docs', 'insurance', 'training', 'risk', 'roadmap'];
  const tabLabels = { overview: 'Overview', budget: 'Budget', gear: 'Gear', docs: 'Docs', insurance: 'Insurance', training: 'Training', risk: 'Risk', roadmap: 'Roadmap' };

  // Simulate streaming — reveal tabs one by one
  useEffect(() => {
    tabs.forEach((t, i) => {
      setTimeout(() => {
        setVisibleTabs(prev => prev.includes(t) ? prev : [...prev, t]);
      }, i * 350);
    });
  }, []);

  const adv = plan.recommended_adventure || {};
  const alt = plan.alternative_adventure || {};
  const bud = plan.budget || {};
  const gear = plan.gear || {};
  const ins = plan.insurance || {};
  const risk = plan.risk_analysis || {};

  return (
    <div className="adv-card plan-card" ref={planCardRef}>
      <div className="adv-card-header">🏔 YOUR ADVENTURE PLAN</div>

      {/* Seasonal / Companion notes */}
      {plan.seasonal_note && (
        <div className="plan-intel-strip seasonal">🌤 {plan.seasonal_note}</div>
      )}
      {plan.companion_note && (
        <div className="plan-intel-strip companion">👥 {plan.companion_note}</div>
      )}

      <div className="plan-meta-strip">
        <div className="plan-meta-item"><span className="plan-meta-label">Persona</span><span className="plan-meta-val">{plan.persona}</span></div>
        <div className="plan-meta-item"><span className="plan-meta-label">Readiness</span><span className="plan-meta-val">{plan.readiness_index}%</span></div>
        <div className="plan-meta-item"><span className="plan-meta-label">Risk</span><span className="plan-meta-val">{plan.risk_tier}</span></div>
        <div className="plan-meta-item"><span className="plan-meta-label">Level</span><span className="plan-meta-val">{plan.adventure_tier}</span></div>
      </div>

      {/* Tab bar — tabs reveal as they stream in */}
      <div className="plan-tabs">
        {tabs.map(t => (
          <button
            key={t}
            className={`plan-tab${tab === t ? ' active' : ''}${!visibleTabs.includes(t) ? ' plan-tab-loading' : ''}`}
            onClick={() => visibleTabs.includes(t) && setTab(t)}
          >
            {tabLabels[t]}
            {!visibleTabs.includes(t) && <span className="plan-tab-dot" />}
          </button>
        ))}
      </div>

      <div className="plan-tab-body">
        {tab === 'overview' && (
          <div className="plan-tab-anim">
            <div className="plan-section-title">{adv.name}</div>
            <div className="plan-why">{adv.why_it_fits}</div>
            <div className="plan-detail-row"><span>📍 Location</span><span>{adv.location}</span></div>
            <div className="plan-detail-row"><span>📅 Duration</span><span>{adv.duration_days} days</span></div>
            <div className="plan-scores">
              <ScoreBar label="Story Value" value={adv.story_value_score} color="#e05a2b" />
              <ScoreBar label="Physical" value={adv.physical_challenge} color="#c0392b" />
              <ScoreBar label="Mental" value={adv.mental_challenge} color="#8e44ad" />
              <ScoreBar label="Technical" value={adv.technical_difficulty} color="#2980b9" />
              <ScoreBar label="Risk" value={adv.risk_score} color="#e67e22" />
            </div>

            {/* Alternative plan comparison */}
            {alt.name && (
              <div className="plan-alt-comparison">
                <div className="pac-title">⚡ Your stretch goal</div>
                <div className="pac-name">{alt.name}</div>
                <div className="pac-loc">{alt.location}</div>
                <div className="pac-why">{alt.why}</div>
                <div className="pac-diff">↑ {alt.difficulty_jump}</div>
              </div>
            )}

            {/* Share button */}
            <button className="plan-share-btn" onClick={onShare}>
              📲 Share this plan
            </button>
          </div>
        )}

        {tab === 'budget' && (
          <div className="plan-tab-anim">
            <div className="plan-budget-total">Total: {bud.currency} {bud.total?.toLocaleString()}</div>
            {[['✈ Transport', bud.transportation], ['🏨 Accommodation', bud.accommodation], ['🍽 Food', bud.food], ['🎒 Gear', bud.gear], ['📋 Permits', bud.permits], ['🧭 Guides', bud.guides], ['🛡 Insurance', bud.insurance], ['🆘 Buffer', bud.emergency_buffer]].map(([label, val]) => (
              <div className="plan-budget-row" key={label}>
                <span>{label}</span><span>{bud.currency} {val?.toLocaleString()}</span>
                {bud.total > 0 && <div className="plan-budget-bar" style={{ width: `${Math.round((val / bud.total) * 100)}%` }} />}
              </div>
            ))}
            <div className="plan-section-title" style={{ marginTop: 16 }}>✈ Travel Plan</div>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>{plan.travel_plan}</p>
          </div>
        )}

        {tab === 'gear' && (
          <div className="plan-tab-anim">
            {gear.mandatory?.length > 0 && <><div className="plan-gear-group">🔴 Mandatory</div>{gear.mandatory.map(g => <div className="plan-gear-item" key={g}>• {g}</div>)}</>}
            {gear.recommended?.length > 0 && <><div className="plan-gear-group">🟡 Recommended</div>{gear.recommended.map(g => <div className="plan-gear-item" key={g}>• {g}</div>)}</>}
            {gear.optional?.length > 0 && <><div className="plan-gear-group">🟢 Optional</div>{gear.optional.map(g => <div className="plan-gear-item" key={g}>• {g}</div>)}</>}
            <div className="plan-gear-costs">
              <div>Buy: <strong>{bud.currency} {gear.estimated_buy_cost?.toLocaleString()}</strong></div>
              <div>Rental: <strong>{bud.currency} {gear.estimated_rental_cost?.toLocaleString()}</strong></div>
            </div>
          </div>
        )}

        {tab === 'docs' && (
          <div className="plan-tab-anim">
            <div className="plan-section-title">Required Documentation</div>
            {(plan.documentation || []).map(d => <div className="plan-doc-item" key={d}>📄 {d}</div>)}
          </div>
        )}

        {tab === 'insurance' && (
          <div className="plan-tab-anim">
            <div className="plan-ins-type">{ins.type_required}</div>
            <div className="plan-detail-row"><span>Premium</span><span>{bud.currency} {ins.estimated_premium?.toLocaleString()}</span></div>
            <div className="plan-detail-row"><span>Min Coverage</span><span>USD {ins.min_coverage_usd?.toLocaleString()}</span></div>
            <div className="plan-ins-covers">
              {[['Rescue', ins.rescue_coverage], ['Evacuation', ins.evacuation_coverage], ['Repatriation', ins.repatriation_coverage], ['Gear', ins.gear_protection], ['Trip Cancel', ins.trip_cancellation]].map(([l, v]) => (
                <div key={l} className={`plan-ins-tag ${v ? 'covered' : 'not-covered'}`}>{v ? '✓' : '✗'} {l}</div>
              ))}
            </div>
            {ins.exclusions_to_watch?.length > 0 && <><div className="plan-section-title" style={{ marginTop: 12 }}>⚠ Watch out for</div>{ins.exclusions_to_watch.map(e => <div className="plan-gear-item" key={e}>• {e}</div>)}</>}
          </div>
        )}

        {tab === 'training' && (
          <div className="plan-tab-anim">
            <div className="plan-section-title">Training Plan</div>
            <p style={{ lineHeight: 1.7, fontSize: 13 }}>{plan.training_plan}</p>
          </div>
        )}

        {tab === 'risk' && (
          <div className="plan-tab-anim">
            <div className="plan-section-title">Risk Analysis</div>
            {[['⚡ Physical', risk.physical], ['🔧 Technical', risk.technical], ['🌿 Environmental', risk.environmental], ['💰 Financial', risk.financial]].map(([label, val]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{val}</div>
              </div>
            ))}
            <div className="plan-detail-row" style={{ marginTop: 12 }}><span>Rescue Complexity</span><span>{risk.rescue_complexity}</span></div>
          </div>
        )}

        {tab === 'roadmap' && (
          <div className="plan-tab-anim">
            <div className="plan-section-title">1-Year Plan</div>
            <p style={{ lineHeight: 1.7, fontSize: 13 }}>{plan.one_year_plan}</p>
            <div className="plan-section-title" style={{ marginTop: 14 }}>5-Year Roadmap</div>
            <p style={{ lineHeight: 1.7, fontSize: 13 }}>{plan.five_year_roadmap}</p>
            {plan.lifetime_bucket_list?.length > 0 && (
              <><div className="plan-section-title" style={{ marginTop: 14 }}>🪣 Lifetime Bucket List</div>
              {plan.lifetime_bucket_list.map((item, i) => <div className="plan-bucket-item" key={i}>#{i + 1} {item}</div>)}</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──
export default function AdventurePage({ toast, user }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING.content, action: null, profile: null, plan: null },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [fieldProgress, setFieldProgress] = useState(0);
  const [showDemo, setShowDemo] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const bottomRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const planCardRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const speak = useCallback((text) => {
    if (!voiceOn || !synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US'; utt.rate = 1.05;
    synthRef.current.speak(utt);
  }, [voiceOn]);

  const saveToSupabase = useCallback(async (profile) => {
    try {
      await supabase.from('adventure_profiles').insert({
        session_id: `session_${Date.now()}`, plan_number: 1,
        created_at_utc: new Date().toISOString(),
        caller_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        name: profile.name, age: profile.age ? parseInt(profile.age) : null,
        home_city: profile.home_city, adventure_sport: profile.adventure_sport,
        planned_location: profile.planned_location, fitness_level: profile.fitness_level,
        certifications: profile.certifications,
        preferred_currency: profile.preferred_currency,
        budget: profile.budget ? parseFloat(profile.budget) : null,
        available_days: profile.available_days ? parseInt(profile.available_days) : null,
        risk_tolerance: profile.risk_tolerance, status: 'complete',
        user_id: user?.id || null,
        experience_notes: `Travel month: ${profile.travel_month || 'N/A'} | Companions: ${profile.travel_companions || 'Solo'}`,
      });
    } catch (e) { console.error('Supabase save failed:', e); }
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await resp.json();
      const aiMsg = {
        role: 'assistant',
        content: data.message || 'Something went wrong.',
        action: data.action || null,
        profile: data.profile || null,
        plan: data.plan || null,
        persona_reveal: data.persona_reveal || null,
      };
      if (data.profile) {
        setCurrentProfile(data.profile);
        const filled = Object.values(data.profile).filter(v => v !== null && v !== '' && v !== undefined).length;
        setFieldProgress(Math.min(filled, TOTAL_FIELDS));
      } else {
        const userCount = updated.filter(m => m.role === 'user').length;
        setFieldProgress(f => Math.max(f, Math.min(userCount, TOTAL_FIELDS - 2)));
      }
      setMessages(prev => [...prev, aiMsg]);
      speak(data.message || '');
      setSuggestions(data.suggestions || []);
      if (data.action === 'show_plan' && data.profile) saveToSupabase(data.profile);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.', action: null, profile: null, plan: null }]);
    } finally { setLoading(false); }
  }, [messages, loading, speak, saveToSupabase]);

  // Lock it in — shows persona first, then generates plan
  const handleFinalConfirm = useCallback(async () => {
    if (!currentProfile || loading) return;
    setLoading(true);

    const userMsg = { role: 'user', content: 'Yes, lock it in!', action: null, profile: null, plan: null };
    const fillerMsg = {
      role: 'assistant',
      content: "Let me figure out what kind of adventurer you are first — then I'll build your plan...",
      action: null, profile: null, plan: null,
    };
    setMessages(prev => [...prev, userMsg, fillerMsg]);

    try {
      const resp = await fetch('/api/adventure-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: currentProfile }),
      });
      const data = await resp.json();
      if (!data.plan) throw new Error(data.error || 'No plan returned');

      // Persona reveal first
      if (data.persona_reveal) {
        const personaMsg = {
          role: 'assistant',
          content: `You're a ${data.persona_reveal.persona}. ${data.persona_reveal.tagline}`,
          action: 'show_persona',
          profile: currentProfile,
          plan: null,
          persona_reveal: data.persona_reveal,
        };
        setMessages(prev => [...prev, personaMsg]);
        speak(personaMsg.content);
        setLoading(false);
        // Store plan for after persona confirm
        setCurrentProfile({ ...currentProfile, _pendingPlan: data.plan });
      } else {
        // No persona, go straight to plan
        showPlan(data.plan);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong generating your plan. Please try again.', action: null, profile: null, plan: null }]);
      setLoading(false);
    }
  }, [currentProfile, loading, speak, saveToSupabase]);

  const showPlan = useCallback((plan) => {
    const planMsg = {
      role: 'assistant',
      content: "Your adventure plan is ready — and I've included a stretch goal for when you're ready to level up! Keep chatting if you want to adjust anything.",
      action: 'show_plan',
      profile: currentProfile,
      plan,
    };
    setMessages(prev => [...prev, planMsg]);
    speak(planMsg.content);
    saveToSupabase(currentProfile);
    setPlanGenerated(true);
    setFieldProgress(TOTAL_FIELDS);
  }, [currentProfile, speak, saveToSupabase]);

  const handlePersonaConfirm = useCallback(() => {
    if (currentProfile?._pendingPlan) {
      const plan = currentProfile._pendingPlan;
      setCurrentProfile(prev => { const p = { ...prev }; delete p._pendingPlan; return p; });
      showPlan(plan);
    }
  }, [currentProfile, showPlan]);

  const handleConfirmProfile = useCallback(() => sendMessage("Yes, everything looks correct!"), [sendMessage]);
  const handleEditProfile = useCallback(() => sendMessage("I'd like to edit a field."), [sendMessage]);

  const toggleVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Voice not supported in this browser'); return; }
    if (listening) { setListening(false); return; }
    const recog = new SR();
    recog.lang = 'en-US'; recog.interimResults = false;
    recog.onresult = (e) => sendMessage(e.results[0][0].transcript);
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);
    recog.start();
    setListening(true);
  }, [listening, sendMessage, toast]);

  const loadDemo = useCallback(() => {
    const DEMO_PROFILE = { name: 'Alex', age: 29, home_city: 'Mumbai', adventure_sport: 'Trekking', planned_location: 'Himalayas', fitness_level: 'High', certifications: 'None', preferred_currency: 'INR', budget: 80000, available_days: 7, risk_tolerance: 'Moderate', travel_month: 'October', travel_companions: 'Solo' };
    const DEMO_PERSONA = { persona: 'Mountaineer', emoji: '🏔', tagline: 'Driven by summits, technical challenge, and stories worth telling.', dimensions: [{ name: 'Endurance', score: 8 }, { name: 'Technical Skill', score: 6 }, { name: 'Risk Appetite', score: 7 }, { name: 'Self-Sufficiency', score: 7 }, { name: 'Adventure Spirit', score: 9 }] };
    const DEMO_PLAN = { persona: 'Mountaineer', readiness_index: 82, risk_tier: 'Moderate', adventure_tier: 'Intermediate', seasonal_note: 'October is peak season in Himalayas — clear skies, dry trails. Book 3 months ahead.', companion_note: '', recommended_adventure: { name: 'Kedarkantha Winter Trek', why_it_fits: 'Perfect 7-day moderate trek. Summit views at 12,500 ft reward high fitness without technical skills.', location: 'Uttarkashi, Uttarakhand', duration_days: 7, story_value_score: 9, physical_challenge: 7, mental_challenge: 6, technical_difficulty: 4, risk_score: 5 }, alternative_adventure: { name: 'Roopkund Trek', location: 'Chamoli, Uttarakhand', why: 'The skeleton lake trek at 16,000ft — your 6-month goal after building altitude experience.', difficulty_jump: '3 difficulty levels higher, requires prior high-altitude experience', budget_change: 15000 }, budget: { currency: 'INR', total: 78000, transportation: 18000, accommodation: 12000, food: 8000, gear: 15000, permits: 2000, guides: 14000, insurance: 3000, emergency_buffer: 6000 }, travel_plan: 'Mumbai → Dehradun (flight, 2hrs, ₹6,000) → Sankri base camp by taxi (8hrs, ₹2,500 shared). Acclimatise on Day 1.', gear: { mandatory: ['Trekking boots', 'Down jacket', 'Layered thermals', 'Trekking poles', 'Headlamp'], recommended: ['Gaiters', 'Buff', 'Dry bags'], optional: ['GoPro'], estimated_buy_cost: 14000, estimated_rental_cost: 4000 }, documentation: ['Valid Indian ID', 'Kedarkantha Forest Permit (₹500)', 'Medical fitness certificate'], insurance: { type_required: 'Adventure Sports + Emergency Evacuation', estimated_premium: 2800, min_coverage_usd: 50000, rescue_coverage: true, evacuation_coverage: true, repatriation_coverage: true, gear_protection: false, trip_cancellation: true, exclusions_to_watch: ['Pre-existing cardiac conditions', 'Unguided solo trekking'] }, training_plan: 'Weeks 1-2: Daily 5km runs + stair climbing. Weeks 3-4: Weekend hikes with 10kg pack. Week 5-6: 15kg pack + yoga.', risk_analysis: { physical: 'Moderate. AMS risk low if acclimatisation schedule followed.', technical: 'Low-Moderate. Snow slopes need microspikes.', environmental: 'Moderate. Temperature drops to -10°C at summit.', financial: 'Low. Fixed operator pricing, 8% emergency buffer.', rescue_complexity: 'Moderate' }, one_year_plan: 'Month 1-3: Kedarkantha. Month 4-6: Valley of Flowers. Month 7-9: Roopkund. Month 12: Stok Kangri base camp.', five_year_roadmap: 'Year 1: Kedarkantha → Roopkund. Year 2: Hampta Pass. Year 3: Annapurna Circuit. Year 4: Island Peak. Year 5: EBC.', lifetime_bucket_list: ['Everest Base Camp', 'Patagonia W Trek', 'Kilimanjaro Summit', 'Tour du Mont Blanc', 'K2 Base Camp'] };
    setShowDemo(true);
    setCurrentProfile(DEMO_PROFILE);
    setFieldProgress(TOTAL_FIELDS);
    setPlanGenerated(true);
    setMessages([
      { role: 'assistant', content: GREETING.content, action: null, profile: null, plan: null },
      { role: 'user', content: '(Demo mode)', action: null, profile: null, plan: null },
      { role: 'assistant', content: `You're a ${DEMO_PERSONA.persona}. ${DEMO_PERSONA.tagline}`, action: 'show_persona', profile: DEMO_PROFILE, plan: null, persona_reveal: DEMO_PERSONA },
      { role: 'assistant', content: "Here's a sample adventure plan for Alex — Kedarkantha Winter Trek from Mumbai.", action: 'show_plan', profile: DEMO_PROFILE, plan: DEMO_PLAN },
    ]);
  }, []);

  // Share plan as image
  const handleShare = useCallback(async () => {
    if (!planCardRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(planCardRef.current, { scale: 2, backgroundColor: '#fff', useCORS: true });
      const link = document.createElement('a');
      link.download = 'trailmind-adventure-plan.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('Plan image downloaded! Share it anywhere 🏔');
    } catch (e) {
      toast('Share coming soon!');
    }
  }, [toast]);

  return (
    <div className="adv-page">
      <div className="adv-hero">
        <div className="wrap">
          <div className="adv-hero-badge">Adventure Sport AI</div>
          <h1 className="adv-hero-title">Your Personal Adventure Consultant</h1>
          <p className="adv-hero-sub">Just tell me about yourself and what you want to do — I'll handle the rest.</p>
          <button className="adv-demo-btn" onClick={loadDemo}>👁 See a sample plan first</button>
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
              {showDemo && (
                <button className="adv-demo-reset" onClick={() => {
                  setShowDemo(false); setFieldProgress(0); setCurrentProfile(null);
                  setPlanGenerated(false);
                  setMessages([{ role: 'assistant', content: GREETING.content, action: null, profile: null, plan: null }]);
                }}>← Start my plan</button>
              )}
              <button className={`adv-voice-toggle ${voiceOn ? 'active' : ''}`} onClick={() => setVoiceOn(v => !v)}>
                🔊 {voiceOn ? 'Voice On' : 'Voice Off'}
              </button>
            </div>
          </div>

          {!showDemo && fieldProgress > 0 && fieldProgress < TOTAL_FIELDS && (
            <div className="adv-progress-bar">
              <div className="adv-progress-inner">
                <div className="adv-progress-fill" style={{ width: `${(fieldProgress / TOTAL_FIELDS) * 100}%` }} />
              </div>
              <span className="adv-progress-label">Step {fieldProgress} of {TOTAL_FIELDS}</span>
            </div>
          )}

          {planGenerated && (
            <div className="adv-refine-banner">
              💬 Plan generated — keep chatting to refine it. Try: "Make it cheaper", "More extreme", or "What if I go in December?"
            </div>
          )}

          <div className="adv-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`adv-msg-wrap ${msg.role}`}>
                {msg.role === 'assistant' && <div className="adv-avatar">🏔</div>}
                <div className={`adv-bubble ${msg.role}`}>
                  <div className="adv-bubble-text">{msg.content}</div>
                  {msg.action === 'show_profile_card' && msg.profile && (
                    <ProfileCard profile={msg.profile} onConfirm={handleConfirmProfile} onEdit={handleEditProfile} />
                  )}
                  {msg.action === 'show_persona' && msg.persona_reveal && (
                    <PersonaReveal data={msg.persona_reveal} onContinue={handlePersonaConfirm} />
                  )}
                  {msg.action === 'show_plan' && msg.plan && (
                    <PlanCard plan={msg.plan} onShare={handleShare} planCardRef={planCardRef} />
                  )}
                  {msg.action === 'show_cta' && (
                    <div className="adv-plan-cta">
                      <a href="/my-trips?tab=adventures" className="btn btn-coral" style={{ fontSize: 13, padding: '8px 20px', textDecoration: 'none' }}>View in My Trips →</a>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="adv-msg-wrap assistant">
                <div className="adv-avatar">🏔</div>
                <div className="adv-bubble assistant">
                  <div className="adv-typing"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {suggestions.length > 0 && !loading && !planGenerated && (
            <div className="adv-suggestions">
              {suggestions.map((s, i) => (
                <button key={i} className="adv-suggestion-chip" onClick={() => {
                  setSuggestions([]);
                  sendMessage(s);
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="adv-input-row">
            <button className={`adv-mic-btn ${listening ? 'active' : ''}`} onClick={toggleVoice}>
              {listening ? '🔴' : '🎙'}
            </button>
            <input
              className="adv-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder={planGenerated ? 'Ask to refine your plan...' : listening ? 'Listening…' : 'Tell me about yourself and your dream adventure…'}
              disabled={loading || listening}
            />
            <button className="btn btn-coral adv-send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
