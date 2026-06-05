const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const PLAN_PROMPT = `You are Trailmind, an expert adventure travel planner.
Generate a detailed travel itinerary from the structured inputs provided.

RESPOND with a single valid JSON object. No markdown, no code fences, no extra text.

{"message":"1-2 sentence enthusiastic intro about this specific trip","plan":{"city":"CityName","country":"Country","duration":N,"nights":N,"tier":"Style","travellers":N,"score":75,"itinerary":[{"day":1,"theme":"Arrival & Explore","activities":[{"time":"09:00","name":"Real Place Name","type":"Culture","duration":"2h","cost":15,"lat":25.197,"lng":55.274},{"time":"12:00","name":"Real Restaurant","type":"Food","duration":"1.5h","cost":20,"lat":25.204,"lng":55.270},{"time":"15:00","name":"Real Activity","type":"Adventure","duration":"3h","cost":40,"lat":25.252,"lng":55.300}]}],"breakdown":{"activities":340,"accommodation":600,"food":250,"transport":100,"buffer":129,"total":1419},"accommodation":[{"name":"Real Hotel","type":"Boutique Hotel","pricePerNight":120}]}}

Rules:
- Use REAL place names, restaurants, hotels that exist
- Include accurate lat and lng (decimal degrees) for EVERY activity
- 3 activities per day with realistic times and costs in USD
- breakdown.total should approximate the stated budget
- nights = duration - 1
- Show up to 5 days in itinerary (mention remaining days in message)
- 2-3 accommodation options matching the tier
- score 60-96 reflecting budget/experience fit
- All costs per person in USD`;

const PACKING_PROMPT = `You are Trailmind's packing assistant.
Generate a smart packing list based on the trip details provided.

RESPOND with a single valid JSON object. No markdown, no code fences, no extra text.

{"categories":[{"name":"Essentials","items":["Passport","Travel insurance docs","Phone charger"]},{"name":"Clothing","items":["T-shirts x3","Hiking pants"]},{"name":"Gear","items":["Daypack","Sunscreen"]},{"name":"Toiletries","items":["Toothbrush","Sunblock"]},{"name":"Tech","items":["Power bank","Camera"]}]}

Rules:
- 4-6 categories, 3-8 items each
- Tailor to destination climate, trip style, and activities
- Include adventure-specific gear when relevant
- Keep items practical and specific (not generic)
- No duplicate items across categories`;

function extractResponse(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed.categories !== undefined) return parsed;
    if (parsed.message !== undefined) return parsed;
  } catch {}
  const m = text.match(/\{[\s\S]*("message"|"categories")[\s\S]*\}/);
  if (m) {
    try {
      const parsed = JSON.parse(m[0]);
      if (parsed.categories !== undefined) return parsed;
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

  const { tripParams, currency, type } = body;
  if (!tripParams || !tripParams.destination) {
    return Response.json({ message: 'Missing trip details.', plan: null });
  }

  const p = tripParams;
  let systemPrompt, userMessage, maxTokens;

  if (type === 'packing') {
    systemPrompt = PACKING_PROMPT;
    userMessage = [
      'Packing list for a ' + p.duration + '-day ' + p.style + ' trip to ' + p.destination + '.',
      p.travellers > 1 ? 'Group of ' + p.travellers + '.' : 'Solo traveller.',
    ].join(' ');
    maxTokens = 1500;
  } else {
    systemPrompt = PLAN_PROMPT;
    userMessage = [
      'Plan a ' + p.duration + '-day ' + p.style + ' trip to ' + p.destination,
      'for ' + p.travellers + ' traveller(s).',
      'Budget: $' + p.budget + ' per person USD.',
      currency && currency !== 'USD' ? 'Also mention approximate ' + currency + ' equivalents.' : ''
    ].filter(Boolean).join(' ');
    maxTokens = 3000;
  }

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
        max_tokens: maxTokens,
        system: systemPrompt,
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
