import { useState, useEffect } from 'react';
import {
  CITIES, TIER_NAMES, TIERS, PL_STAGES, DAY_THEMES, DAY_TIMES,
  computeTrip, actCost, cityIdx, money
} from '../data.js';

export default function PlannerPage({
  plannerCity, plannerTier, plannerPax, plannerSelections,
  setPlannerCity, setPlannerTier, setPlannerPax,
  showExplore, toast, currency = 'USD'
}) {
  const m = (n) => money(n, currency);
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState(0);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (plannerSelections && plannerSelections.length > 0 && plannerCity) {
      generate();
    }
  }, []);

  const tier = plannerTier || 'Mid-range';
  const pax = plannerPax || 2;

  const generate = () => {
    const c = CITIES.find(x => x.name === plannerCity) || CITIES[0];
    setGenerating(true);
    setStage(0);
    setPlan(null);
    let s = 0;
    const iv = setInterval(() => {
      s++;
      setStage(s);
      if (s >= PL_STAGES.length) {
        clearInterval(iv);
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
        setPlan({ city: c, calc, days, selected, tier, score });
        setGenerating(false);
      }
    }, 600);
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
          <span className="badge">&#10022; AI TRIP PLANNER</span>
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
                <button key={t} className={tier === t ? 'on' : ''} onClick={() => setPlannerTier(t)}>{t}</button>
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

        {plan && !generating && (
          <div className="pl-out">
            <div className="pl-top">
              <div>
                <h3>{plan.calc.days}-day {plan.city.name} adventure</h3>
                <div className="sub">{plan.tier} &#183; {plan.selected.length} experiences &#183; {pax} traveller{pax > 1 ? 's' : ''} &#183; {plan.city.country}</div>
              </div>
              {renderDial(plan.score)}
            </div>

            <div className="pl-cols">
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.5px', marginBottom: 14 }}>Your day-by-day plan</h4>
                {plan.days.map((d, di) => (
                  <div className="day" key={di}>
                    <div className="dh">
                      <div className="dn">{di + 1}</div>
                      <div className="dt">{d.label}</div>
                      <div className="dtag">{m(d.dayCost)} activities</div>
                    </div>
                    <div className="di">
                      {d.acts.map((a, ai) => (
                        <div className="arow" key={ai}>
                          <div className="atime">{a.displayTime}</div>
                          <div>
                            <div className="an">{a.t}</div>
                            <div className="am">{a.type} &#183; {a.time}</div>
                          </div>
                          <div className="acost">{a.cost === 0 ? 'Free' : '~' + m(a.cost)}</div>
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
                    <div className="r"><span>Activities &amp; entries</span><b>~{m(plan.calc.activities)}</b></div>
                    <div className="r"><span>Stay ({plan.calc.nights} nights)</span><b>~{m(plan.calc.stay)}</b></div>
                    <div className="r"><span>Food</span><b>~{m(plan.calc.food)}</b></div>
                    <div className="r"><span>Local transport</span><b>~{m(plan.calc.transport)}</b></div>
                    <div className="r"><span>Buffer (10%)</span><b>~{m(plan.calc.buffer)}</b></div>
                    <div className="tot"><span>Per person</span><span>~{m(plan.calc.total)}</span></div>
                    {pax > 1 && (
                      <div className="r" style={{ marginTop: 6 }}>
                        <span>&#215; {pax} travellers</span>
                        <b style={{ color: 'var(--color-coral)' }}>~{m(plan.calc.total * pax)}</b>
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
                        <div className="so-p">~{m(price)}<span style={{ color: 'var(--color-gray)', fontWeight: 500 }}>/night</span></div>
                      </div>
                    );
                  })}
                </div>

                <button className="btn btn-coral" style={{ width: '100%', justifyContent: 'center' }} onClick={() => toast('Trip saved')}>Save this trip</button>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--color-line)', marginTop: 10 }} onClick={() => toast('PDF export ready')}>Export as PDF</button>
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
