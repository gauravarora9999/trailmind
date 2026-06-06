import { useState } from 'react';
import { supabase } from '../supabase.js';

// Password strength checker
const getPasswordStrength = (pw) => {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' };
  if (score === 2) return { label: 'Fair', color: '#f59e0b', width: '50%' };
  if (score === 3) return { label: 'Good', color: '#3b82f6', width: '75%' };
  return { label: 'Strong', color: '#22c55e', width: '100%' };
};

export default function AuthModal({ mode, onClose, onSwap }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isSignup = mode === 'signup';
  const strength = isSignup ? getPasswordStrength(pw) : null;

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
        // Supabase sends OTP email — show OTP input
        setStep('otp');
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the 6-digit code'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (err) throw err;
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.resend({ type: 'signup', email });
      if (err) throw err;
      // Start 60s cooldown
      setResendCooldown(60);
      const iv = setInterval(() => {
        setResendCooldown(n => { if (n <= 1) { clearInterval(iv); return 0; } return n - 1; });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  const handleSocial = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (err) throw err;
    } catch (err) {
      setError(err.message || 'OAuth failed');
      setLoading(false);
    }
  };

  // ── OTP verification screen ──
  if (step === 'otp') {
    return (
      <div className="modal" onClick={onClose}>
        <div className="auth" onClick={e => e.stopPropagation()}>
          <button className="x" onClick={onClose}>&times;</button>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <h3>Check your email</h3>
            <p className="asub">We sent a 6-digit code to <strong>{email}</strong></p>
          </div>

          {error && <div style={{ color: '#EF4444', fontSize: 13, fontWeight: 600, marginBottom: 12, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8 }}>{error}</div>}

          <form onSubmit={handleVerifyOtp}>
            <label>Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{ letterSpacing: 8, fontSize: 24, textAlign: 'center', fontWeight: 700 }}
              autoFocus
            />
            <button className="btn btn-coral" type="submit" disabled={loading || otp.length !== 6}
              style={{ width: '100%', marginTop: 20, justifyContent: 'center', opacity: (loading || otp.length !== 6) ? 0.6 : 1 }}>
              {loading ? 'Verifying...' : 'Verify & continue'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-gray)' }}>
            Didn&apos;t receive it?{' '}
            {resendCooldown > 0 ? (
              <span>Resend in {resendCooldown}s</span>
            ) : (
              <span
                onClick={handleResend}
                style={{ color: 'var(--color-coral)', cursor: resending ? 'default' : 'pointer', fontWeight: 600 }}
              >
                {resending ? 'Sending...' : 'Resend code'}
              </span>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <span onClick={() => setStep('form')} style={{ fontSize: 13, color: 'var(--color-gray)', cursor: 'pointer' }}>
              ← Back
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign up / Log in form ──
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
          <input type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />

          {/* Password strength bar */}
          {isSignup && pw && strength && (
            <div style={{ marginTop: 6, marginBottom: 4 }}>
              <div style={{ height: 4, background: '#f0f0f4', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: 4, transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: strength.color, marginTop: 4 }}>{strength.label}</div>
            </div>
          )}

          <button className="btn btn-coral" type="submit" disabled={loading}
            style={{ width: '100%', marginTop: '20px', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}>
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
