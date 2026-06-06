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
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password: pw,
          options: { data: { name } },
        });
        if (err) throw err;
        // If Supabase returned a session, user is logged in immediately (email confirm disabled)
        // If no session, account created but needs confirmation — show friendly message
        if (data?.session) {
          onClose();
        } else {
          setError('Account created! Please check your email to confirm, then log in.');
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (err) throw err;
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="modal" onClick={onClose}>
      <div className="auth" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose}>&times;</button>

        <h3>{isSignup ? 'Create account' : 'Welcome back'}</h3>
        <p className="asub">{isSignup ? 'Start planning smarter trips' : 'Log in to your Trailmind account'}</p>

        {error && (
          <div style={{
            color: error.startsWith('Account created') ? '#15803d' : '#EF4444',
            fontSize: 13, fontWeight: 600, marginBottom: 12, padding: '8px 12px',
            background: error.startsWith('Account created') ? '#f0fdf4' : '#FEF2F2',
            borderRadius: 8
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label>Name</label>
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            </>
          )}
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />

          <button
            className="btn btn-coral"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: '20px', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>

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
