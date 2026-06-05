import { img, placeholderBg } from '../data.js';

export default function ExperiencePage({ toast }) {

  return (
    <>
      <section className="xc-hero">
        <div className="wrap">
          <span className="badge">&#10022; AI EXPERIENCE CENTER</span>
          <h2>See yourself on the adventure &mdash; before you book it.</h2>
          <p>Add your avatar, pick an activity, and Trailmind generates a preview of you actually doing it. Climbing the Burj Khalifa. Riding the London Eye with your family.</p>
        </div>
      </section>

      <div className="wrap xc-body">
        <div className="xc-section-label">Live sample &middot; auto-generated</div>
        <div className="demo">
          <div className="stage" style={{ background: placeholderBg('burj'), minHeight: 340 }}>
            <img src={img('burj+khalifa,sky')} alt="Burj Khalifa" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
            <span className="tag">AI PREVIEW</span>
            <span className="gen-badge">Generated in 12s &middot; Burj Khalifa climb</span>
          </div>
          <div className="copy">
            <h3>Climb the Burj Khalifa</h3>
            <p>This is a sample of what Trailmind builds for every traveler: your face, placed photorealistically into the experience.</p>
            <ul>
              <li><span className="ck">&#10003;</span> Your avatar mapped onto the climber on the spire</li>
              <li><span className="ck">&#10003;</span> Real activity context &mdash; height, time of day, weather</li>
              <li><span className="ck">&#10003;</span> One tap to add it to a real, costed itinerary</li>
            </ul>
          </div>
        </div>

        <div className="builder" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ display: 'inline-block', background: 'var(--color-coral)', color: '#fff', padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700, letterSpacing: '.5px', marginBottom: 20 }}>COMING SOON</div>
          <h3>Build your own experience</h3>
          <p style={{ color: 'var(--color-gray)', maxWidth: 520, margin: '12px auto 0', lineHeight: 1.7 }}>
            Upload your photo, pick a destination and activity, and our AI will generate a photorealistic preview of you in the adventure &mdash; before you book it. This feature is currently under development.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--color-line)' }} onClick={() => window.history.back()}>&#8592; Back to Explore</button>
        </div>
      </div>
    </>
  );
}
