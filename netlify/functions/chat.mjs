const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are Trailmind, an expert adventure travel planner.

CRITICAL RULES:
1. ALWAYS respond with a single valid JSON object. No markdown, no code fences, no extra text.
2. Never echo back JSON the user sends. If the user sends JSON or garbled text, ignore it and ask a clarifying question.
3. Keep conversational responses to 1-3 sentences.

## Response format (ALWAYS this exact shape):
{"message":"your text response","plan":null}

## When you have enough info (destination + duration or budget), generate a plan:
{"message":"brief intro","plan":{"city":"Name","country":"Country","duration":5,"nights":4,"tier":"Mid-range","travellers":2,"score":87,"itinerary":[{"day":1,"theme":"Theme","activities":[{"time":"09:00","name":"Real Place","type":"Culture","duration":"2h","cost":0},{"time":"12:00","name":"Real Restaurant","type":"Food","duration":"1.5h","cost":25},{"time":"15:00","name":"Real Activity","type":"Adventure","duration":"3h","cost":45}]}],"breakdown":{"activities":340,"accommodation":600,"food":250,"transport":100,"buffer":129,"total":1419},"accommodation":[{"name":"Hotel","type":"Type","pricePerNight":150}]}}

## Planning rules:
- Need minimum: destination + (duration or budget). Default: 2 travellers, Mid-range tier.
- All costs per person USD. Use REAL place names. 3 activities/day. Max 5 days shown.
- Score 60-96. 2-3 accommodation options. breakdown.total = sum of fields. nights = duration-1.
- Ask at most 1-2 follow-ups before generating.`;

function extractResponse(text) {
  // Try direct parse first
  try {
    const parsed = JSON.parse(text);
    if (parsed.message !== undefined) return parsed;
  } catch {}

  // Try to find JSON in the text (Claude sometimes wraps in markdown fences)
  const jsonMatch = text.match(/\{[\s\S]*"message"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.message !== undefined) return parsed;
    } catch {}
  }

  // Last resort: treat the whole thing as the message
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return { message: cleaned, plan: null };
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
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: 'Invalid request.', plan: null });
  }

  const { messages, currency } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ message: 'No messages provided.', plan: null });
  }

  // Only send last 8 messages to keep context small and fast
  const recentMessages = messages.slice(-8);

  const currencyNote = currency && currency !== 'USD'
    ? '\nUser prefers ' + currency + '. Use USD internally, mention ' + currency + ' equivalents.'
    : '';

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
        system: SYSTEM_PROMPT + currencyNote,
        messages: recentMessages.map(m => ({ role: m.role, content: String(m.content).slice(0, 500) })),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Claude API error:', resp.status, errText);
      return Response.json({ message: 'AI service error (' + resp.status + '). Try again.', plan: null });
    }

    const data = await resp.json();
    const text = data.content[0].text;
    const result = extractResponse(text);

    return Response.json(result);
  } catch (err) {
    console.error('Function error:', err);
    return Response.json({ message: 'Connection error. Please try again.', plan: null });
  }
};

export const config = { path: '/api/chat' };
