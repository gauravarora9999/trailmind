const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are Trailmind, an expert adventure travel planner.
Generate a detailed travel itinerary from the structured inputs provided.

RESPOND with a single valid JSON object. No markdown, no code fences, no extra text.

{"message":"1-2 sentence enthusiastic intro about this specific trip","plan":{"city":"CityName","country":"Country","duration":N,"nights":N,"tier":"Style","travellers":N,"score":75,"itinerary":[{"day":1,"theme":"Arrival & Explore","activities":[{"time":"09:00","name":"Real Place Name","type":"Culture","duration":"2h","cost":15},{"time":"12:00","name":"Real Restaurant","type":"Food","duration":"1.5h","cost":20},{"time":"15:00","name":"Real Activity","type":"Adventure","duration":"3h","cost":40}]}],"breakdown":{"activities":340,"accommodation":600,"food":250,"transport":100,"buffer":129,"total":1419},"accommodation":[{"name":"Real Hotel","type":"Boutique Hotel","pricePerNight":120}]}}

Rules:
- Use REAL place names, restaurants, hotels that exist
- 3 activities per day with realistic times and costs in USD
- breakdown.total should approximate the stated budget
- nights = duration - 1
- Show up to 5 days in itinerary (mention remaining days in message)
- 2-3 accommodation options matching the tier
- score 60-96 reflecting budget/experience fit
- All costs per person in USD`;

function extractResponse(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed.message !== undefined) return parsed;
  } catch {}
  const m = text.match(/\{[\s\S]*"message"[\s\S]*\}/);
  if (m) {
    try {
      const parsed = JSON.parse(m[0]);
      if (parsed.message !== undefined) return parsed;
    } catch {}
  }
  return { message: text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim(), plan: null };
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ message: 'API key not configured. Set ANTHROPIC_API_KEY in Netlify environment variables.', plan: null });
  }

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ message: 'Invalid request.', plan: null });
  }

  const { tripParams, currency } = body;
  if (!tripParams || !tripParams.destination) {
    return Response.json({ message: 'Missing trip details.', plan: null });
  }

  const p = tripParams;
  const userMessage = [
    'Plan a ' + p.duration + '-day ' + p.style + ' trip to ' + p.destination,
    'for ' + p.travellers + ' traveller(s).',
    'Budget: $' + p.budget + ' per person USD.',
    currency && currency !== 'USD' ? 'Also mention approximate ' + currency + ' equivalents.' : ''
  ].filter(Boolean).join(' ');

  try {
    const resp = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Claude API error:', resp.status, errText);
      return Response.json({ message: 'AI service error (' + resp.status + '). Try again.', plan: null });
    }

    const data = await resp.json();
    const text = data.content[0].text;
    return Response.json(extractResponse(text));
  } catch (err) {
    console.error('Function error:', err);
    return Response.json({ message: 'Connection error. Please try again.', plan: null });
  }
};

export const config = { path: '/api/chat' };
