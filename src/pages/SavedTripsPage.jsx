import { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';

function TripCard({ trip, onOpenPlanner }) {
  const bd = trip.cost_breakdown || {};
  const total = trip.total_cost_pp || bd.total || 0;

  return (
    <div className="st-card">
      <div className="st-card-header">
        <div>
          <div className="st-city">{trip.city_name || '—'}</div>
          <div className="st-country">{trip.country || ''}{trip.region ? ` · ${trip.region}` : ''}</div>
        </div>
        <div className="st-badge">{trip.tier || 'Mid-range'}</div>
      </div>
      <div className="st-meta">
        <div className="st-meta-item"><span>👥</span>{trip.pax || 2} travellers</div>
        <div className="st-meta-item"><span>📅</span>{trip.days_count || '—'} days</div>
        <div className="st-meta-item"><span>💰</span>${total.toLocaleString()} pp</div>
        {trip.score && <div className="st-meta-item"><span>⭐</span>{trip.score}/100</div>}
      </div>
      {trip.plan_days && trip.plan_days.length > 0 && (
        <div className="st-days">
          {trip.plan_days.slice(0, 3).map((day, i) => (
            <div key={i} className="st-day-chip">Day {i + 1}: {day.label || day.theme || 'Exploration'}</div>
          ))}
          {trip.plan_days.length > 3 && <div className="st-day-chip muted">+{trip.plan_days.length - 3} more</div>}
        </div>
      )}
      <div className="st-card-footer">
        <span className="st-source">{trip.source === 'voice' ? '🎙 Voice plan' : '🤖 AI plan'}</span>
        <span className="st-date">{new Date(trip.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
  );
}

function AdventureCard({ profile }) {
  return (
    <div className="st-card adventure">
      <div className="st-card-header">
        <div>
          <div className="st-city">{profile.adventure_sport || '—'}</div>
          <div className="st-country">{profile.planned_location || ''}</div>
        </div>
        <div className="st-badge" style={{ background: '#fff3ec', color: '#e05a2b' }}>Adventure</div>
      </div>
      <div className="st-meta">
        <div className="st-meta-item"><span>🏠</span>{profile.home_city}</div>
        <div className="st-meta-item"><span>📅</span>{profile.available_days} days</div>
        <div className="st-meta-item"><span>⚡</span>{profile.fitness_level} fitness</div>
        <div className="st-meta-item"><span>🎯</span>{profile.risk_tolerance} risk</div>
      </div>
      <div className="st-card-footer">
        <span className="st-source">🗻 Adventure plan</span>
        <span className="st-date">{new Date(profile.created_at_utc).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
  );
}

export default function SavedTripsPage({ user, openAuth, showPlanner, showAdventure }) {
  const [trips, setTrips] = useState([]);
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('trips');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: t }, { data: a }] = await Promise.all([
        supabase.from('saved_trips').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('adventure_profiles').select('*').eq('user_id', user.id).order('created_at_utc', { ascending: false }),
      ]);
      setTrips(t || []);
      setAdventures(a || []);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  if (!user) {
    return (
      <div className="st-page">
        <div className="st-empty-state">
          <div className="st-empty-icon">🔒</div>
          <h2>Sign in to see your saved trips</h2>
          <p>Your plans are saved to your account. Sign in to access them anytime.</p>
          <button className="btn btn-coral" onClick={() => openAuth('login')}>Sign in</button>
        </div>
      </div>
    );
  }

  const totalTrips = trips.length + adventures.length;

  return (
    <div className="st-page">
      <div className="st-hero">
        <div className="wrap">
          <h1 className="st-hero-title">Your Saved Plans</h1>
          <p className="st-hero-sub">All your AI-generated adventures in one place</p>
          <div className="st-stats">
            <div className="st-stat"><span>{trips.length}</span>Travel Plans</div>
            <div className="st-stat"><span>{adventures.length}</span>Adventure Plans</div>
          </div>
        </div>
      </div>

      <div className="wrap st-wrap">
        {loading ? (
          <div className="st-loading">
            {[1, 2, 3].map(i => <div key={i} className="st-skeleton" />)}
          </div>
        ) : totalTrips === 0 ? (
          <div className="st-empty-state">
            <div className="st-empty-icon">🗺</div>
            <h2>No saved plans yet</h2>
            <p>Generate your first AI travel plan or adventure profile and it'll appear here.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-coral" onClick={showPlanner}>Plan a trip</button>
              <button className="btn btn-ghost" onClick={showAdventure}>Adventure AI</button>
            </div>
          </div>
        ) : (
          <>
            <div className="st-tabs">
              <button className={`st-tab ${tab === 'trips' ? 'active' : ''}`} onClick={() => setTab('trips')}>
                Travel Plans <span className="st-count">{trips.length}</span>
              </button>
              <button className={`st-tab ${tab === 'adventures' ? 'active' : ''}`} onClick={() => setTab('adventures')}>
                Adventure Plans <span className="st-count">{adventures.length}</span>
              </button>
            </div>

            {tab === 'trips' && (
              trips.length === 0 ? (
                <div className="st-empty-state" style={{ paddingTop: 40 }}>
                  <div className="st-empty-icon">✈️</div>
                  <h2>No travel plans yet</h2>
                  <button className="btn btn-coral" onClick={showPlanner}>Plan a trip</button>
                </div>
              ) : (
                <div className="st-grid">
                  {trips.map(t => <TripCard key={t.id} trip={t} />)}
                </div>
              )
            )}

            {tab === 'adventures' && (
              adventures.length === 0 ? (
                <div className="st-empty-state" style={{ paddingTop: 40 }}>
                  <div className="st-empty-icon">🏔</div>
                  <h2>No adventure plans yet</h2>
                  <button className="btn btn-coral" onClick={showAdventure}>Start Adventure AI</button>
                </div>
              ) : (
                <div className="st-grid">
                  {adventures.map(a => <AdventureCard key={a.id} profile={a} />)}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
