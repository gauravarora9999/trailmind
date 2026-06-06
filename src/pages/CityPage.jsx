import { CITIES, TIER_NAMES, TIERS, img, placeholderBg, actCost, computeTrip, cityIdx, money } from '../data.js';

export default function CityPage({
  cityName, trip, tripTier, onTierChange, onToggleAct, onRemoveTrip,
  onPlanTrip, showExplore, toast
}) {
  const city = CITIES.find(c => c.name === cityName);
  if (!city) {
    return (
      <div className="wrap" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>City not found</h2>
        <button className="btn btn-coral" onClick={showExplore} style={{ marginTop: 16 }}>Back to Explore</button>
      </div>
    );
  }

  const inTrip = (title) => trip.includes(title);
  const tripActs = city.acts.filter(a => trip.includes(a.t));
  const calc = tripActs.length > 0 ? computeTrip(city, tripActs, tripTier) : null;
  const cidx = cityIdx(city.name);

  return (
    <>
      {/* ── Hero Banner ── */}
      <div className="hero-city">
        <div className="ph" style={{ background: placeholderBg(city.q) }}>
          <img
            src={img(city.q)}
            alt={city.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="overlay" />
        <div className="htext">
          <h1>{city.name}</h1>
          <p>{city.country} &middot; {city.acts.length} activities &middot; {city.region}</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="city-body">
        <div className="back" onClick={showExplore}>&larr; Back to Explore</div>

        <div className="city-grid">
          {/* ── Activities Column ── */}
          <div>
            <div className="sec-title">Things to do</div>
            <div className="sec-sub">Add activities to build your trip — costs are estimates per person.</div>

            {city.acts.map((a) => {
              const added = inTrip(a.t);
              const cost = actCost(a.type, tripTier, cidx);
              return (
                <div className="act" key={a.t}>
                  <div className="thumb" style={{ background: placeholderBg(a.t) }}>
                    <img
                      src={img(a.t + ' ' + city.name)}
                      alt={a.t}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div className="info">
                    <h3>{a.t}</h3>
                    <div className="tagline">{a.d}</div>
                    <div className="row">
                      <span className="chip">{a.type}</span>
                      <span className="chip">{a.time}</span>
                      <span className="rating">&#9733; {a.rating}</span>
                      <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '14px', color: 'var(--color-forest)' }}>
                        {cost === 0 ? 'Free' : `~${money(cost)}`}
                      </span>
                    </div>
                  </div>
                  <button
                    className="add-btn"
                    style={added ? { background: 'var(--color-forest)' } : {}}
                    onClick={() => onToggleAct(a.t)}
                  >
                    {added ? '✓' : '+'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Trip Panel ── */}
          <div>
            <div className="panel">
              <div className="sec-title">Your trip</div>
              <div className="sec-sub" style={{ marginBottom: '16px' }}>Select a tier — all figures are estimates.</div>

              {/* Tier selector */}
              <div className="tier-sel">
                {TIER_NAMES.map((t) => (
                  <button
                    key={t}
                    className={tripTier === t ? 'active' : ''}
                    onClick={() => onTierChange(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Trip list */}
              <div className="trip-list">
                {tripActs.length === 0 ? (
                  <div className="empty">Add activities from the list to start building your trip.</div>
                ) : (
                  tripActs.map((a) => (
                    <div
                      key={a.t}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--color-line)',
                        fontSize: '14px'
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>{a.t}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--color-forest)', fontSize: '13px' }}>
                          ~{money(actCost(a.type, tripTier, cidx))}
                        </span>
                        <button
                          onClick={() => onRemoveTrip(a.t)}
                          style={{
                            background: 'none', border: 'none', color: 'var(--color-gray)',
                            fontSize: '16px', cursor: 'pointer', padding: '0 4px'
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cost breakdown */}
              {calc && (
                <>
                  <div className="calc-grid">
                    <div className="box"><b>{calc.days}</b><span>days</span></div>
                    <div className="box"><b>{calc.nights}</b><span>nights</span></div>
                    <div className="box"><b>{tripActs.length}</b><span>activities</span></div>
                  </div>
                  <div className="brk">
                    <div className="r"><span>Activities &amp; entries</span><b>~{money(calc.activities)}</b></div>
                    <div className="r"><span>Stay ({calc.nights} nights)</span><b>~{money(calc.stay)}</b></div>
                    <div className="r"><span>Food</span><b>~{money(calc.food)}</b></div>
                    <div className="r"><span>Local transport</span><b>~{money(calc.transport)}</b></div>
                    <div className="r"><span>Buffer (10%)</span><b>~{money(calc.buffer)}</b></div>
                    <div className="tot"><span>Est. total / person</span><span>~{money(calc.total)}</span></div>
                  </div>

                  {/* Suggested stay */}
                  <div className="stay-pick">
                    <div className="lbl">SUGGESTED STAY &middot; {tripTier.toUpperCase()}</div>
                    <div className="name">{calc.stays[0][0]}</div>
                    <div style={{ color: 'var(--color-gray)' }}>{calc.stays[0][1]} &middot; ~{money(Math.round(TIERS[tripTier].stayBase * calc.cidx))}/night</div>
                  </div>

                  <button
                    className="btn btn-coral"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}
                    onClick={() => onPlanTrip(city.name, trip, tripTier)}
                  >
                    Build my itinerary
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
