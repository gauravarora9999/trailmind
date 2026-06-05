import { useState } from 'react';
import { supabase } from '../supabase.js';

export default function AuthModal({ mode, onClose, onSwap }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSignup = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        const { error: err } = await supabase.auth.signUp({
          email,
          password: pw,
          options: { data: { name } }
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password: pw
        });
        if (err) throw err;
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({ provider });
      if (err) throw err;
    } catch (err) {
      setError(err.message || 'OAuth failed');
      setLoading(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="auth" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose}>&times;</button>

        <h3>{isSignup ? 'Create account' : 'Welcome back'}</h3>
        <p className="asub">{isSignup ? 'Start planning smarter trips' : 'Log in to your Trailmind account'}</p>

        {error && <div style={{ color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 12, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label>Name</label>
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </>
          )}
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />

          <button className="btn btn-coral" type="submit" disabled={loading} style={{ width: '100%', marginTop: '20px', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div className="or">or</div>

        <div className="soc-btns">
          <button className="sbtn" onClick={() => handleSocial('google')} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.01 24.01 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
          <button className="sbtn" onClick={() => handleSocial('apple')} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.51-3.23 0-1.44.64-2.2.45-3.06-.4C3.79 16.16 4.36 9.53 8.82 9.27c1.28.07 2.17.74 2.92.78.97-.2 1.9-.76 2.95-.69 1.25.1 2.19.6 2.8 1.52-2.56 1.54-1.95 4.92.56 5.87-.47 1.25-.73 1.82-1.5 2.93l.5.6zM12.05 9.19c-.15-2.45 1.84-4.53 4.07-4.69.31 2.63-2.38 4.87-4.07 4.69z"/></svg>
            Continue with Apple
          </button>
        </div>

        <div className="swap">
          {isSignup ? (
            <>Already have an account? <span onClick={() => onSwap('login')}>Log in</span></>
          ) : (
            <>Don&apos;t have an account? <span onClick={() => onSwap('signup')}>Sign up</span></>
          )}
        </div>
      </div>
    </div>
  );
}
