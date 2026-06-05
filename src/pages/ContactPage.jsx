import { useState } from 'react';

export default function ContactPage({ toast }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    toast('Message sent — we will be in touch!');
    setName('');
    setEmail('');
    setMsg('');
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
          <button className="btn btn-coral" type="submit" style={{ alignSelf: 'flex-start' }}>
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}
