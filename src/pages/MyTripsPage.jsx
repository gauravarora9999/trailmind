import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabase.js';
import { money } from '../data.js';

function TripDetail({ trip, onClose }) {
  const bd = trip.cost_breakdown || {};
  const days = trip.plan_days || [];
  return (
    <div className="trip-detail-overlay" onClick={onClose}>
      <div className="trip-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="trip-detail-header">
          <div>
            <h2>{trip.city_name}</h2>
            <div className="trip-detail-meta">{trip.country} · {trip.tier} · {trip.pax} traveller{trip.pax > 1 ? 's' : ''}</div>
          </div>
          <button className="trip-detail-close" onClick={onClose}>✕</button>
        </div>

        <div className="trip-detail-stats">
          <div className="tds-item"><span>{trip.days_count}</span>Days</div>
          <div className="tds-item"><span>{trip.nights_count}</span>Nights</div>
          <div className="tds-item"><span>{money(trip.total_cost_pp)}</span>Per person</div>
          <div className="tds-item"><span>{trip.score}%</span>Match</div>
        </div>

        {days.length > 0 && (
          <div className="trip-detail-days">
            {days.map((day, i) => (
              <div key={i} className="trip-detail-day">
                <div className="tdd-label">Day {i + 1} — {day.label || day.theme || 'Exploration'}</div>
                {(day.acts || []).map((act, j) => (
                  <div key={j} className="tdd-act">
                    <span className="tdd-time">{act.displayTime || act.time || ''}</span>
                    <span className="tdd-name">{act.t || act.name}</span>
                    {act.cost > 0 && <span className="tdd-cost">${act.cost}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {Object.keys(bd).length > 0 && (
          <div className="trip-detail-breakdown">
            <div className="tdb-title">Cost breakdown</div>
            {[['Activities', bd.activities], ['Accommodation', bd.stay], ['Food', bd.food], ['Transport', bd.transport], ['Buffer', bd.buffer]].map(([label, val]) => val != null && (
              <div key={label} className="tdb-row">
                <span>{label}</span><span>{money(val)}</span>
              </div>
            ))}
            <div className="tdb-total"><span>Total pp</span><span>{money(bd.total || trip.total_cost_pp)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdventureCard({ profile }) {
  return (
    <div className="mt-card adventure">
      <div className="mt-card-header">
        <div>
          <div className="mt-city">{profile.adventure_sport}</div>
          <div className="mt-country">{profile.planned_location}</div>
        </div>
        <span className="mt-badge adventure-badge">🏔 Adventure</span>
      </div>
      <div className="mt-pills">
        <span className="mt-pill">📍 {profile.home_city}</span>
        <span className="mt-pill">📅 {profile.available_days} days</span>
        <span className="mt-pill">⚡ {profile.fitness_level}</span>
        <span className="mt-pill">🎯 {profile.risk_tolerance} risk</span>
      </div>
      {profile.preferred_currency && profile.budget && (
        <div className="mt-budget">{profile.preferred_currency} {Number(profile.budget).toLocaleString()} budget</div>
      )}
      <div className="mt-card-footer">
        <span className="mt-date">{new Date(profile.created_at_utc).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
  );
}

export default function MyTripsPage({ user, toast, showExplore, openPlanner }) {
  const location = useLocation();
  const defaultTab = new URLSearchParams(location.search).get('tab') === 'adventures' ? 'adventures' : 'trips';

  const [trips, setTrips] = useState([]);
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(defaultTab);
  const [viewingTrip, setViewingTrip] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [{ data: t, error: te }, { data: a, error: ae }] = await Promise.all([
        supabase.from('saved_trips').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('adventure_profiles').select('*').eq('user_id', user.id).order('created_at_utc', { ascending: false }),
      ]);
      if (te) toast('Failed to load trips: ' + te.message);
      if (ae) console.error('Adventure load failed:', ae.message);
      setTrips(t || []);
      setAdventures(a || []);
      setLoading(false);
    })();
  }, [user]);

  const deleteTrip = async (id) => {
    const { error } = await supabase.from('saved_trips').delete().eq('id', id);
    if (error) { toast('Delete failed: ' + error.message); return; }
    setTrips(prev => prev.filter(t => t.id !== id));
    toast('Trip deleted');
  };

  if (!user) {
    return (
      <div className="mt-page">
        <div className="mt-empty-hero">
          <div className="mt-empty-icon">🔒</div>
          <h2>Sign in to see your saved trips</h2>
          <p>All your AI-planned trips and adventures in one place.</p>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--color-line)' }} onClick={showExplore}>← Back to Explore</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-page">
      <section className="mt-hero">
        <div className="wrap">
          <h1>My Trips</h1>
          <p>All your AI-generated plans, ready to pick back up.</p>
          <div className="mt-hero-stats">
            <div><b>{trips.length}</b> travel plans</div>
            <div><b>{adventures.length}</b> adventure plans</div>
          </div>
        </div>
      </section>

      <div className="wrap mt-wrap">
        <div className="mt-tabs">
          <button className={`mt-tab${tab === 'trips' ? ' active' : ''}`} onClick={() => setTab('trips')}>
            ✈️ Travel Plans <span className="mt-count">{trips.length}</span>
          </button>
          <button className={`mt-tab${tab === 'adventures' ? ' active' : ''}`} onClick={() => setTab('adventures')}>
            🏔 Adventure Plans <span className="mt-count">{adventures.length}</span>
          </button>
        </div>

        {loading ? (
          <div className="mt-skeleton-grid">
            {[1, 2, 3].map(i => <div key={i} className="mt-skeleton" />)}
          </div>
        ) : tab === 'trips' ? (
          trips.length === 0 ? (
            <div className="mt-empty">
              <div className="mt-empty-icon">✈️</div>
              <h3>No travel plans yet</h3>
              <p>Generate your first AI trip and save it here.</p>
              <button className="btn btn-coral" onClick={showExplore}>Explore destinations</button>
            </div>
          ) : (
            <div className="mt-grid">
              {trips.map(t => (
                <div key={t.id} className="mt-card">
                  <div className="mt-card-header">
                    <div>
                      <div className="mt-city">{t.city_name}</div>
                      <div className="mt-country">{t.country}{t.region ? ` · ${t.region}` : ''}</div>
                    </div>
                    <span className="mt-badge">{t.tier}</span>
                  </div>
                  <div className="mt-pills">
                    <span className="mt-pill">📅 {t.days_count}d / {t.nights_count}n</span>
                    <span className="mt-pill">👥 {t.pax} traveller{t.pax > 1 ? 's' : ''}</span>
                    <span className="mt-pill">💰 {money(t.total_cost_pp)} pp</span>
                    {t.score && <span className="mt-pill">⭐ {t.score}% match</span>}
                  </div>
                  <div className="mt-source-tag">{t.source === 'voice' ? '🎙 Voice plan' : '🤖 AI plan'}</div>
                  <div className="mt-card-footer">
                    <span className="mt-date">{new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <div className="mt-actions">
                      <button className="mt-btn-view" onClick={() => setViewingTrip(t)}>View plan</button>
                      <button className="mt-btn-delete" onClick={() => deleteTrip(t.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          adventures.length === 0 ? (
            <div className="mt-empty">
              <div className="mt-empty-icon">🏔</div>
              <h3>No adventure plans yet</h3>
              <p>Use Adventure AI to get a personalised adventure plan.</p>
              <button className="btn btn-coral" onClick={() => window.location.href = '/adventure'}>Try Adventure AI</button>
            </div>
          ) : (
            <div className="mt-grid">
              {adventures.map(a => <AdventureCard key={a.id} profile={a} />)}
            </div>
          )
        )}
      </div>

      {viewingTrip && <TripDetail trip={viewingTrip} onClose={() => setViewingTrip(null)} />}
    </div>
  );
}
