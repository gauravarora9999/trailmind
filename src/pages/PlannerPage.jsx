import { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';
import {
  CITIES, TIER_NAMES, TIERS, PL_STAGES, DAY_THEMES, DAY_TIMES,
  computeTrip, actCost, cityIdx, money
} from '../data.js';

export default function PlannerPage({
  plannerCity, plannerTier, plannerPax, plannerSelections,
  setPlannerCity, setPlannerTier, setPlannerPax,
  showExplore, toast, user
}) {
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState(0);
  const [plan, setPlan] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (plannerSelections && plannerSelections.length > 0 && plannerCity) {
      generate();
    }
  }, []);

  const tier = plannerTier || 'Mid-range';
  const pax = plannerPax || 2;

  const generate = async () => {
    const c = CITIES.find(x => x.name === plannerCity) || CITIES[0];
    setGenerating(true);
    setStage(0);
    setPlan(null);
    setAiInsights(null);

    // Build plan deterministically
    const selected = plannerSelections && plannerSelections.length > 0
      ? c.acts.filter(a => plannerSelections.includes(a.t))
      : c.acts;
    const calc = computeTrip(c, selected, tier);
    const days = [];
    for (let d = 0; d < calc.days; d++) {
      const dayActs = selected.slice(d * 3, d * 3 + 3);
      if (dayActs.length === 0) break;
      const dayCost = dayActs.reduce((sum, a) => sum + actCost(a.type, tier, cityIdx(c.name)), 0);
      days.push({
        label: DAY_THEMES[Math.min(d, DAY_THEMES.length - 1)],
        dayCost,
        acts: dayActs.map((a, i) => ({
          ...a,
          displayTime: DAY_TIMES[i] || '18:00',
          cost: actCost(a.type, tier, cityIdx(c.name))
        }))
      });
    }
    const score = Math.min(96, 78 + (tier === 'Mid-range' ? 9 : tier === 'Luxury' ? 6 : 5) + (selected.length >= 5 ? 3 : 0));

    // Call Claude API for personalized insights
    let stageIdx = 0;
    const stageIv = setInterval(() => { stageIdx++; setStage(stageIdx); }, 800);

    try {
      const res = await fetch('/.netlify/functions/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: c.name,
          country: c.country,
          activities: selected.map(a => ({ t: a.t, type: a.type, time: a.time, d: a.d })),
          tier,
          pax
        })
      });
      if (res.ok) {
        const insights = await res.json();
        setAiInsights(insights);
      }
    } catch (err) {
      console.log('AI insights unavailable:', err.message);
    }

    clearInterval(stageIv);
    setPlan({ city: c, calc, days, selected, tier, score });
    setGenerating(false);
  };

  const exportPDF = async () => {
    if (!plan) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const m = 20;
      let y = m;
      const pw = 170;

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Trailmind Trip Plan', m, y);
      y += 10;
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(1);
      doc.line(m, y, m + pw, y);
      y += 12;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${plan.calc.days}-Day ${plan.city.name} Adventure`, m, y);
      y += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${plan.city.country}  |  ${plan.tier}  |  ${pax} traveller${pax > 1 ? 's' : ''}  |  Match: ${plan.score}%`, m, y);
      y += 14;

      plan.days.forEach((d, di) => {
        if (y > 250) { doc.addPage(); y = m; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(245, 158, 11);
        doc.text(`Day ${di + 1}: ${d.label}`, m, y);
        doc.setTextColor(0, 0, 0);
        y += 7;
        d.acts.forEach(a => {
          if (y > 270) { doc.addPage(); y = m; }
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const cost = a.cost === 0 ? 'Free' : `~$${a.cost}`;
          doc.text(`${a.displayTime}  ${a.t}  (${a.type}, ${a.time})  ${cost}`, m + 4, y);
          y += 5.5;
        });
        y += 5;
      });

      if (y > 230) { doc.addPage(); y = m; }
      y += 4;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Cost Breakdown (per person)', m, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const costs = [
        ['Activities & entries', plan.calc.activities],
        [`Stay (${plan.calc.nights} nights)`, plan.calc.stay],
        ['Food', plan.calc.food],
        ['Local transport', plan.calc.transport],
        ['Buffer (10%)', plan.calc.buffer],
      ];
      costs.forEach(([label, val]) => {
        doc.text(label, m + 4, y);
        doc.text(`~$${val.toLocaleString()}`, m + pw - 4, y, { align: 'right' });
        y += 6;
      });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      y += 2;
      doc.text('Total per person', m + 4, y);
      doc.text(`~$${plan.calc.total.toLocaleString()}`, m + pw - 4, y, { align: 'right' });
      y += 7;
      if (pax > 1) {
        doc.setTextColor(245, 158, 11);
        doc.text(`x ${pax} travellers`, m + 4, y);
        doc.text(`~$${(plan.calc.total * pax).toLocaleString()}`, m + pw - 4, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        y += 10;
      }

      if (y > 240) { doc.addPage(); y = m; }
      y += 4;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Where to Stay', m, y);
      y += 8;
      doc.setFontSize(10);
      TIERS[plan.tier].stays.forEach((s, i) => {
        if (y > 270) { doc.addPage(); y = m; }
        const price = Math.round(TIERS[plan.tier].stayBase * cityIdx(plan.city.name) * (i === 0 ? 1 : i === 1 ? 1.15 : 1.4));
        doc.setFont('helvetica', 'bold');
        doc.text(s[0], m + 4, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`~$${price}/night`, m + pw - 4, y, { align: 'right' });
        y += 5;
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(s[1], m + 4, y);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        y += 7;
      });

      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by Trailmind  |  thetrailmind.netlify.app', m, y);

      doc.save(`trailmind-${plan.city.name.toLowerCase().replace(/\s/g, '-')}.pdf`);
      toast('PDF downloaded');
    } catch (err) {
      toast('PDF export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const renderDial = (score) => {
    const r = 50, C = 2 * Math.PI * r, off = C * (1 - score / 100);
    return (
      <svg viewBox="0 0 120 120" style={{ width: 108, height: 108, flexShrink: 0 }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F59E0B" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off}
          transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 1.1s ease' }} />
        <text x="60" y="58" textAnchor="middle" fontSize="26" fontWeight="900" fill="#111827">{score}%</text>
        <text x="60" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6B7280">MATCH</text>
      </svg>
    );
  };

  return (
    <>
      <section className="pl-hero">
        <div className="wrap">
          <span className="badge">&#10022; TRIP PLANNER</span>
          <h2>Tell us the place and the budget. We'll cost the whole trip.</h2>
          <p>Pick a destination and a budget style &#8212; Trailmind builds the days, prices every activity, and suggests where to stay.</p>
        </div>
      </section>

      <div className="wrap pl-body">
        <div className="pl-controls">
          <div className="fld">
            <label>DESTINATION</label>
            <select value={plannerCity || CITIES[0].name} onChange={e => setPlannerCity(e.target.value)}>
              {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="fld">
            <label>BUDGET STYLE</label>
            <div className="seg">
              {TIER_NAMES.map(t => (
                <button key={t} className={tier === t ? 'active' : ''} onClick={() => setPlannerTier(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="fld">
            <label>TRAVELLERS</label>
            <select value={pax} onChange={e => setPlannerPax(Number(e.target.value))}>
              {[1,2,3,4].map(n => <option key={n} value={n}>{n} traveller{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <button className="btn btn-coral" onClick={generate} disabled={generating}>&#10022; Generate plan</button>
        </div>

        {generating && (
          <div className="pl-gen show">
            <div className="spinner" />
            <div className="t">{PL_STAGES[Math.min(stage, PL_STAGES.length - 1)]}</div>
          </div>
        )}

        {generating && (
          <div className="plan-skeleton" style={{ marginTop: 24 }}>
            {[90, 70, 85, 60, 75].map((w, i) => (
              <div key={i} className="plan-skeleton-bar" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {plan && !generating && (
          <div className="pl-out">
            <div className="pl-top">
              <div>
                <h3>{plan.calc.days}-day {plan.city.name} adventure</h3>
                <div className="sub">{plan.tier} &#183; {plan.selected.length} experiences &#183; {pax} traveller{pax > 1 ? 's' : ''} &#183; {plan.city.country}</div>
              </div>
              {renderDial(plan.score)}
            </div>

            {aiInsights?.summary && (
              <div style={{ padding: '20px 24px', background: 'var(--color-stats)', borderRadius: 'var(--radius-card)', marginBottom: 24, fontSize: 15, lineHeight: 1.6, color: 'var(--color-ink)' }}>
                <div style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-coral)', marginBottom: 8 }}>AI Summary</div>
                {aiInsights.summary}
              </div>
            )}

            <div className="pl-cols">
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.5px', marginBottom: 14 }}>Your day-by-day plan</h4>
                {plan.days.map((d, di) => (
                  <div className="day" key={di}>
                    <div className="dh">
                      <div className="dn">{di + 1}</div>
                      <div className="dt">{d.label}</div>
                      <div className="dtag">{money(d.dayCost)} activities</div>
                    </div>
                    <div className="di">
                      {d.acts.map((a, ai) => (
                        <div className="arow" key={ai}>
                          <div className="atime">{a.displayTime}</div>
                          <div>
                            <div className="an">{a.t}</div>
                            <div className="am">{a.type} &#183; {a.time}</div>
                            {aiInsights?.tips?.[a.t] && (
                              <div style={{ fontSize: 13, color: 'var(--color-forest)', marginTop: 4, fontStyle: 'italic' }}>{aiInsights.tips[a.t]}</div>
                            )}
                          </div>
                          <div className="acost">{a.cost === 0 ? 'Free' : '~' + money(a.cost)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="pcard">
                  <h4>Cost breakdown (estimate)</h4>
                  <div className="brk">
                    <div className="r"><span>Activities &amp; entries</span><b>~{money(plan.calc.activities)}</b></div>
                    <div className="r"><span>Stay ({plan.calc.nights} nights)</span><b>~{money(plan.calc.stay)}</b></div>
                    <div className="r"><span>Food</span><b>~{money(plan.calc.food)}</b></div>
                    <div className="r"><span>Local transport</span><b>~{money(plan.calc.transport)}</b></div>
                    <div className="r"><span>Buffer (10%)</span><b>~{money(plan.calc.buffer)}</b></div>
                    <div className="tot"><span>Per person</span><span>~{money(plan.calc.total)}</span></div>
                    {pax > 1 && (
                      <div className="r" style={{ marginTop: 6 }}>
                        <span>&#215; {pax} travellers</span>
                        <b style={{ color: 'var(--color-coral)' }}>~{money(plan.calc.total * pax)}</b>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pcard">
                  <h4>Where to stay</h4>
                  {TIERS[plan.tier].stays.map((s, i) => {
                    const price = Math.round(TIERS[plan.tier].stayBase * cityIdx(plan.city.name) * (i === 0 ? 1 : i === 1 ? 1.15 : 1.4));
                    return (
                      <div className={'stay-opt' + (i === 0 ? ' sel' : '')} key={i}>
                        <div>
                          <div className="so-n">{s[0]}</div>
                          <div className="so-s">{s[1]}</div>
                        </div>
                        <div className="so-p">~{money(price)}<span style={{ color: 'var(--color-gray)', fontWeight: 500 }}>/night</span></div>
                      </div>
                    );
                  })}
                </div>

                <button className="btn btn-coral" style={{ width: '100%', justifyContent: 'center', opacity: saving ? 0.6 : 1, background: saved ? '#16a34a' : undefined }} disabled={saving || saved} onClick={async () => {
                  if (!user) { toast('Sign in to save trips'); return; }
                  setSaving(true);
                  try {
                    const timeout = new Promise((_, reject) =>
                      setTimeout(() => reject(new Error('Save timed out — check your connection')), 10000)
                    );
                    const save = supabase.from('saved_trips').insert({
                      user_id: user.id,
                      source: 'planner',
                      city_name: plan.city.name,
                      country: plan.city.country,
                      region: plan.city.region,
                      tier: plan.tier,
                      pax,
                      score: plan.score,
                      total_cost_pp: plan.calc.total,
                      total_cost_group: plan.calc.total * pax,
                      days_count: plan.calc.days,
                      nights_count: plan.calc.nights,
                      cost_breakdown: {
                        activities: plan.calc.activities,
                        stay: plan.calc.stay,
                        food: plan.calc.food,
                        transport: plan.calc.transport,
                        buffer: plan.calc.buffer,
                        total: plan.calc.total
                      },
                      plan_days: plan.days,
                      selected_activities: plan.selected.map(a => ({ t: a.t, type: a.type, time: a.time }))
                    });
                    const { error } = await Promise.race([save, timeout]);
                    if (error) throw new Error(error.message);
                    setSaved(true);
                    toast('Trip saved! View it in My Trips.');
                    setTimeout(() => setSaved(false), 5000);
                  } catch (err) {
                    toast('Save failed: ' + (err.message || 'Unknown error'));
                  } finally {
                    setSaving(false);
                  }
                }}>{saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save this trip'}</button>
                {saved && (
                  <a href="/my-trips" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--color-line)', marginTop: 8, fontSize: 13, textDecoration: 'none' }}>
                    View in My Trips →
                  </a>
                )}
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--color-line)', marginTop: 10, opacity: exporting ? 0.6 : 1 }} disabled={exporting} onClick={exportPDF}>{exporting ? 'Generating PDF...' : 'Export as PDF'}</button>

                {aiInsights?.dining && aiInsights.dining.length > 0 && (
                  <div className="pcard" style={{ marginTop: 16 }}>
                    <h4>Where to eat</h4>
                    {aiInsights.dining.map((d, i) => (
                      <div key={i} style={{ padding: '10px 0', borderBottom: i < aiInsights.dining.length - 1 ? '1px solid var(--color-line)' : 'none' }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-gray)', marginTop: 2 }}>{d.desc}</div>
                        {d.price && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-forest)', marginTop: 4 }}>{d.price}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {aiInsights?.hiddenGem && (
                  <div className="pcard" style={{ marginTop: 16, border: '1.5px solid var(--color-coral)', background: 'rgba(255,91,58,0.03)' }}>
                    <h4 style={{ color: 'var(--color-coral)' }}>Hidden gem</h4>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{aiInsights.hiddenGem.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-gray)', marginTop: 4 }}>{aiInsights.hiddenGem.desc}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 34 }}>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--color-line)' }} onClick={showExplore}>&#8592; Back to Explore</button>
        </div>
      </div>
    </>
  );
}
