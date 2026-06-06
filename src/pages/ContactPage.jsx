import { useState } from 'react';
import { supabase } from '../supabase.js';

export default function ContactPage({ toast }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast('Please enter your name'); return; }
    if (!email.trim() || !email.includes('@')) { toast('Please enter a valid email'); return; }
    if (!msg.trim()) { toast('Please enter a message'); return; }
    setSending(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name,
        email,
        message: msg
      });
      if (error) throw error;
      toast('Message sent — we will be in touch!');
      setName('');
      setEmail('');
      setMsg('');
    } catch (err) {
      toast('Send failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ct-body">
      <div className="ct-grid">
        <div className="ct-info">
          <h1>Contact us</h1>
          <p>
            Questions, feedback, or partnership ideas — we would love to hear from you. Drop us a note and we will reply within 24 hours.
          </p>
          <p>
            <a href="mailto:hello@trailmind.io">hello@trailmind.io</a>
          </p>
          <p style={{ marginTop: '8px' }}>
            Based in Dubai, UAE. Working globally.
          </p>
        </div>

        <form className="ct-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            placeholder="Your message..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <button className="btn btn-coral" type="submit" disabled={sending} style={{ alignSelf: 'flex-start', opacity: sending ? 0.6 : 1 }}>
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  );
}
