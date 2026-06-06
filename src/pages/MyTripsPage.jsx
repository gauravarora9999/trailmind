import { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';
import { money } from '../data.js';

export default function MyTripsPage({ user, toast, showExplore, openPlanner }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        toast('Failed to load trips: ' + (error.message || 'Unknown error'));
        setTrips([]);
      } else {
        setTrips(data || []);
      }
      setLoading(false);
    })();
  }, [user]);

  const deleteTrip = async (id) => {
    const { error } = await supabase.from('saved_trips').delete().eq('id', id);
    if (error) {
      toast('Delete failed: ' + (error.message || 'Unknown error'));
      return;
    }
    setTrips(prev => prev.filter(t => t.id !== id));
    toast('Trip deleted');
  };

  if (!user) {
    return (
      <>
        <section className="pl-hero">
          <div className="wrap">
            <span className="badge">MY TRIPS</span>
            <h2>Your saved itineraries</h2>
            <p>All the trips you've planned and saved.</p>
          </div>
        </section>
        <div className="wrap" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 18, color: 'var(--color-gray)', marginBottom: 20 }}>Sign in to see your saved trips</p>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--color-line)' }} onClick={showExplore}>&larr; Back to Explore</button>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="pl-hero">
        <div className="wrap">
          <span className="badge">MY TRIPS</span>
          <h2>Your saved itineraries</h2>
          <p>All the trips you've planned and saved.</p>
        </div>
      </section>

      <div className="wrap" style={{ padding: '40px 24px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-gray)', fontSize: 16 }}>Loading...</div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 18, color: 'var(--color-gray)', marginBottom: 20 }}>No trips saved yet</p>
            <button className="btn btn-coral" onClick={showExplore}>Explore destinations</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {trips.map(t => (
              <div key={t.id} style={{
                background: '#fff',
                border: '1px solid var(--color-line)',
                borderRadius: 'var(--radius-card)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-.3px' }}>{t.city_name}</h3>
                    <div style={{ fontSize: 14, color: 'var(--color-gray)', marginTop: 2 }}>{t.country}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
                    background: 'var(--color-sand)', color: 'var(--color-forest)', padding: '4px 10px',
                    borderRadius: 6
                  }}>{t.tier}</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 14 }}>
                  <span style={{ color: 'var(--color-gray)' }}>{t.days_count} days / {t.nights_count} nights</span>
                  <span style={{ color: 'var(--color-gray)' }}>&middot;</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-forest)' }}>~{money(t.total_cost_pp)} pp</span>
                  <span style={{ color: 'var(--color-gray)' }}>&middot;</span>
                  <span style={{ color: 'var(--color-gray)' }}>{t.pax} traveller{t.pax > 1 ? 's' : ''}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-coral)' }}>{t.score}% match</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px',
                    background: t.source === 'voice' ? '#EEF2FF' : '#F0FDF4',
                    color: t.source === 'voice' ? '#4338CA' : '#166534',
                    padding: '3px 8px', borderRadius: 5
                  }}>{t.source}</span>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
                  <button className="btn btn-coral" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }} onClick={() => toast('Coming soon')}>View</button>
                  <button className="btn btn-ghost" style={{ border: '1px solid var(--color-line)', fontSize: 14, padding: '8px 14px' }} onClick={() => deleteTrip(t.id)}>&times; Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 34 }}>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--color-line)' }} onClick={showExplore}>&larr; Back to Explore</button>
        </div>
      </div>
    </>
  );
}
