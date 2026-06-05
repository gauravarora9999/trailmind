import { img, placeholderBg } from '../data.js';

const TEAM = [
  { name: 'Anika Sharma', role: 'CEO & Co-founder', q: 'woman,portrait,professional' },
  { name: 'Liam Chen', role: 'CTO & Co-founder', q: 'man,portrait,professional' },
  { name: 'Sofia Martinez', role: 'Head of Design', q: 'woman,designer,portrait' },
];

export default function AboutPage({ showContact }) {
  return (
    <>
      <section className="ab-hero">
        <div className="wrap">
          <h1>About Trailmind</h1>
          <p>We are building the travel planner we always wished existed — voice-first, visually rich, and honest about what things cost.</p>
        </div>
      </section>

      <div className="ab-body">
        <div className="ab-stats">
          <div><strong>12</strong><span>Destinations</span></div>
          <div><strong>60</strong><span>Curated activities</span></div>
          <div><strong>3</strong><span>Budget tiers</span></div>
          <div><strong>5</strong><span>Voice questions</span></div>
        </div>

        <div className="ab-split">
          <div>
            <h2 style={{ fontWeight: 900, fontSize: '28px', letterSpacing: '-1px', marginBottom: '12px' }}>Why we built this</h2>
            <p style={{ fontSize: '15px', color: 'var(--color-gray)', lineHeight: 1.7 }}>
              Trip planning is fragmented. You jump between apps for flights, hotels, activities, and budgets — none of them talk to each other.
              Trailmind puts AI at the centre: tell us how you travel, and we build a day-by-day plan with transparent cost estimates, matched stays, and sequenced activities.
            </p>
            <p style={{ fontSize: '15px', color: 'var(--color-gray)', lineHeight: 1.7, marginTop: '12px' }}>
              Our voice-first interface means you can plan a trip while cooking dinner. Our Experience Center lets you preview a destination before you book. And every price you see is labelled as an estimate — no bait-and-switch.
            </p>
          </div>
          <div style={{ background: placeholderBg('team,office'), borderRadius: 'var(--radius-card-lg)', overflow: 'hidden', aspectRatio: '4/3' }}>
            <img
              src={img('modern,office,team')}
              alt="Trailmind team"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>

        <h2 style={{ fontWeight: 900, fontSize: '24px', letterSpacing: '-0.8px', textAlign: 'center', marginTop: '60px' }}>The team</h2>
        <div className="team">
          {TEAM.map((m) => (
            <div className="tm" key={m.name}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px', background: placeholderBg(m.q), overflow: 'hidden' }}>
                <img
                  src={img(m.q)}
                  alt={m.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <h4>{m.name}</h4>
              <p>{m.role}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <button className="btn btn-coral" onClick={showContact}>Get in touch</button>
        </div>
      </div>
    </>
  );
}
