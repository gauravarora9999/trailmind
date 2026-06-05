import { useState } from 'react';
import { supabase } from '../supabase.js';
import { XC, GEN_STAGES, img, placeholderBg } from '../data.js';

const SCENE_CITIES = Object.keys(XC);

export default function ExperiencePage({ toast, user, showExplore }) {
  const [selCity, setSelCity] = useState(null);
  const [selAct, setSelAct] = useState(null);
  const [avatars, setAvatars] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [genStage, setGenStage] = useState(0);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const addAvatars = (e) => {
    [...e.target.files].forEach(f => {
      const r = new FileReader();
      r.onload = ev => setAvatars(prev => [...prev, { src: ev.target.result }]);
      r.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const removeAvatar = (i) => setAvatars(prev => prev.filter((_, idx) => idx !== i));

  const generate = () => {
    if (!selCity || selAct === null) { toast('Pick a destination and activity first'); return; }
    setGenerating(true);
    setGenStage(0);
    setResult(null);
    let s = 0;
    const iv = setInterval(() => {
      s++;
      setGenStage(s);
      if (s >= GEN_STAGES.length) {
        clearInterval(iv);
        setResult(XC[selCity][selAct]);
        setGenerating(false);
      }
    }, 650);
  };

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

        <div className="xc-section-label" id="builderTop">Build your own experience</div>
        <div className="builder">
          <h3>Place yourself in the adventure</h3>
          <div className="bsub">Three steps. Choose a place, an activity, add your crew's avatars, and generate.</div>
          <div className="build-steps">
            <div className="step">
              <div className="num">1</div>
              <h4>Choose a destination</h4>
              <div className="opt-row">
                {SCENE_CITIES.map(c => (
                  <button key={c} className={'opt' + (selCity === c ? ' sel' : '')} onClick={() => { setSelCity(c); setSelAct(null); }}>{c}</button>
                ))}
              </div>
            </div>
            <div className="step">
              <div className="num">2</div>
              <h4>Pick an activity</h4>
              {selCity ? (
                <div className="opt-row" style={{ flexDirection: 'column' }}>
                  {XC[selCity].map((a, i) => (
                    <button key={a.t} className={'opt' + (selAct === i ? ' sel' : '')} onClick={() => setSelAct(i)} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8 }}>{a.t}</button>
                  ))}
                </div>
              ) : (
                <div className="empty" style={{ fontSize: 13 }}>Choose a destination first</div>
              )}
            </div>
            <div className="step">
              <div className="num">3</div>
              <h4>Add avatars</h4>
              <label className="uploader" htmlFor="avatarInput">+ Upload face photo(s)</label>
              <input type="file" id="avatarInput" accept="image/*" multiple style={{ display: 'none' }} onChange={addAvatars} />
              <div className="avatars">
                {avatars.map((a, i) => (
                  <div className="avatar" key={i}>
                    <img src={a.src} alt={'Avatar ' + i} />
                    <button className="rm" onClick={() => removeAvatar(i)}>&#10005;</button>
                    <span className="lbl">{i === 0 ? 'You' : 'Guest ' + i}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="go-row">
            <button className="btn btn-coral" onClick={generate}>&#10022; Generate my experience</button>
            <span style={{ color: 'var(--color-gray)', fontSize: 13, fontWeight: 500 }}>No photo? We'll use sample avatars.</span>
          </div>

          {generating && (
            <div className="xc-result" style={{ marginTop: 34 }}>
              <div className="rstage" style={{ background: placeholderBg(selCity), minHeight: 380, position: 'relative' }}>
                <div className="gen-overlay">
                  <div className="spinner" style={{ width: 54, height: 54, borderWidth: 4 }} />
                  <div className="gen-stage-txt">{GEN_STAGES[Math.min(genStage, GEN_STAGES.length - 1)]}</div>
                  <div className="gen-bar"><i style={{ width: ((genStage + 1) / GEN_STAGES.length * 100) + '%' }} /></div>
                </div>
              </div>
            </div>
          )}

          {result && !generating && (
            <div className="xc-result" style={{ marginTop: 34 }}>
              <div className="rstage" style={{ background: placeholderBg(result.q), minHeight: 380, position: 'relative' }}>
                <img src={img(result.q)} alt={result.t} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
              <div className="rcaption">
                <div>
                  <h4>{result.t} &middot; {selCity}</h4>
                  <p>{avatars.length ? avatars.length + ' avatar(s)' : 'Sample avatars'} placed {result.s}.</p>
                </div>
                <div className="acts">
                  <button className="btn btn-ghost" style={{ border: '1px solid var(--color-line)', opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={async () => {
                    if (!user) { toast('Sign in to save previews'); return; }
                    setSaving(true);
                    try {
                      const { error } = await supabase.from('experience_previews').insert({
                        user_id: user.id,
                        city: selCity,
                        activity_title: result.t,
                        scene_description: result.s,
                        image_url: img(result.q)
                      });
                      if (error) throw error;
                      toast('Saved to your gallery');
                    } catch (err) {
                      toast('Save failed: ' + (err.message || 'Unknown error'));
                    } finally {
                      setSaving(false);
                    }
                  }}>{saving ? 'Saving...' : 'Save'}</button>
                  <button className="btn btn-ghost" style={{ border: '1px solid var(--color-line)' }} onClick={() => toast('Shareable link copied')}>Share</button>
                  <button className="btn btn-coral" onClick={() => toast('Added to your itinerary')}>Add to trip</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--color-line)' }} onClick={showExplore}>&#8592; Back to Explore</button>
        </div>
      </div>
    </>
  );
}
